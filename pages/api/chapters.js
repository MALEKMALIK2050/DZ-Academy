import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });

  try {
    // POST — créer chapitre avec positionnement
    if (req.method === "POST") {
      const { courseId, title, objectifs, position } = req.body;
      if (!courseId || !title)
        return res.status(400).json({ error: "courseId et title obligatoires" });

      const parsedCourseId = parseInt(courseId);
      const parsedPosition = position ? parseInt(position) : null;

      const chapter = await prisma.$transaction(async (tx) => {
        // Si position spécifiée, décaler les chapitres existants
        if (parsedPosition !== null && parsedPosition > 0) {
          await tx.chapter.updateMany({
            where: {
              courseId: parsedCourseId,
              ordre: { gte: parsedPosition }
            },
            data: {
              ordre: { increment: 1 }
            }
          });

          // Créer le nouveau chapitre à la position demandée
          return await tx.chapter.create({
            data: {
              courseId: parsedCourseId,
              title,
              objectifs: objectifs || null,
              ordre: parsedPosition,
            },
          });
        } else {
          // Si pas de position, trouver le dernier ordre et ajouter à la fin
          const lastChapter = await tx.chapter.findFirst({
            where: { courseId: parsedCourseId },
            orderBy: { ordre: "desc" },
            select: { ordre: true }
          });

          const nextOrdre = (lastChapter?.ordre ?? 0) + 1;

          return await tx.chapter.create({
            data: {
              courseId: parsedCourseId,
              title,
              objectifs: objectifs || null,
              ordre: nextOrdre,
            },
          });
        }
      });

      return res.status(201).json(chapter);
    }

    // PUT — modifier chapitre (titre, objectifs seulement)
    if (req.method === "PUT") {
      const { chapterId, title, objectifs } = req.body;
      if (!chapterId)
        return res.status(400).json({ error: "chapterId manquant" });

      const updated = await prisma.chapter.update({
        where: { id: parseInt(chapterId) },
        data: {
          ...(title && { title }),
          ...(objectifs !== undefined && { objectifs }),
        },
      });

      return res.status(200).json(updated);
    }

    // PATCH — changer ordre d'un chapitre (avec réorganisation)
    if (req.method === "PATCH") {
      const { chapterId, newOrdre } = req.body;
      if (!chapterId || newOrdre === undefined)
        return res.status(400).json({ error: "chapterId et newOrdre obligatoires" });

      const parsedChapterId = parseInt(chapterId);
      const parsedNewOrdre = parseInt(newOrdre);

      const result = await prisma.$transaction(async (tx) => {
        // Récupérer le chapitre actuel pour connaître son courseId et ancien ordre
        const currentChapter = await tx.chapter.findUnique({
          where: { id: parsedChapterId },
          select: { courseId: true, ordre: true }
        });

        if (!currentChapter)
          return null;

        const oldOrdre = currentChapter.ordre;
        const courseId = currentChapter.courseId;

        if (oldOrdre === parsedNewOrdre) {
          return currentChapter; // Pas de changement
        }

        if (oldOrdre < parsedNewOrdre) {
          // Déplacer vers le bas: décaler les chapitres intermédiaires vers le haut
          await tx.chapter.updateMany({
            where: {
              courseId,
              ordre: { gt: oldOrdre, lte: parsedNewOrdre }
            },
            data: { ordre: { decrement: 1 } }
          });
        } else {
          // Déplacer vers le haut: décaler les chapitres intermédiaires vers le bas
          await tx.chapter.updateMany({
            where: {
              courseId,
              ordre: { gte: parsedNewOrdre, lt: oldOrdre }
            },
            data: { ordre: { increment: 1 } }
          });
        }

        // Mettre à jour le chapitre avec le nouvel ordre
        return await tx.chapter.update({
          where: { id: parsedChapterId },
          data: { ordre: parsedNewOrdre }
        });
      });

      if (!result)
        return res.status(404).json({ error: "Chapitre introuvable" });

      return res.status(200).json(result);
    }

    // DELETE — supprimer chapitre et réorganiser les ordres
    if (req.method === "DELETE") {
      const { chapterId } = req.body;
      if (!chapterId)
        return res.status(400).json({ error: "chapterId manquant" });

      const parsedChapterId = parseInt(chapterId);

      await prisma.$transaction(async (tx) => {
        // Récupérer le chapitre à supprimer
        const chapterToDelete = await tx.chapter.findUnique({
          where: { id: parsedChapterId },
          select: { courseId: true, ordre: true }
        });

        if (!chapterToDelete) return;

        // Supprimer le chapitre
        await tx.chapter.delete({
          where: { id: parsedChapterId }
        });

        // Décaler tous les chapitres après celui-ci
        await tx.chapter.updateMany({
          where: {
            courseId: chapterToDelete.courseId,
            ordre: { gt: chapterToDelete.ordre }
          },
          data: { ordre: { decrement: 1 } }
        });
      });

      return res.status(200).json({ message: "Chapitre supprimé et ordres réorganisés" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (error) {
    console.error("API CHAPTERS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}