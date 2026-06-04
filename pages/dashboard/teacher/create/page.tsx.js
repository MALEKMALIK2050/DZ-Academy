import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });

  try {
    // POST — créer chapitre
    if (req.method === "POST") {
      const { courseId, title, objectifs, ordre } = req.body;
      if (!courseId || !title) return res.status(400).json({ error: "courseId et title obligatoires" });

      const chapter = await prisma.chapter.create({
        data: {
          courseId: parseInt(courseId),
          title,
          objectifs: objectifs || null,
          ordre:     ordre     || 0,
        },
      });
      return res.status(201).json(chapter);
    }

    // PUT — modifier chapitre
    if (req.method === "PUT") {
      const { chapterId, title, objectifs } = req.body;
      if (!chapterId) return res.status(400).json({ error: "chapterId manquant" });

      const updated = await prisma.chapter.update({
        where: { id: parseInt(chapterId) },
        data: {
          ...(title     && { title }),
          ...(objectifs !== undefined && { objectifs }),
        },
      });
      return res.status(200).json(updated);
    }

    // DELETE — supprimer chapitre
    if (req.method === "DELETE") {
      const { chapterId } = req.body;
      if (!chapterId) return res.status(400).json({ error: "chapterId manquant" });

      await prisma.chapter.delete({ where: { id: parseInt(chapterId) } });
      return res.status(200).json({ message: "Chapitre supprimé" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API CHAPTERS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}