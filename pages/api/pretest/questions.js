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
    // POST — Ajouter une question au pretest
    if (req.method === "POST") {
      const { courseId, type, texte, choix, reponse, points } = req.body;
      const parsedCourseId = parseInt(courseId);

      if (!courseId || isNaN(parsedCourseId)) {
        return res.status(400).json({ error: "courseId valide obligatoire" });
      }
      if (!texte) {
        return res.status(400).json({ error: "Le texte de la question est obligatoire" });
      }

      // Vérifier que le cours existe
      const courseExists = await prisma.course.findUnique({
        where: { id: parsedCourseId },
      });
      if (!courseExists) {
        return res.status(404).json({ error: `Le cours avec l'ID ${parsedCourseId} n'existe pas.` });
      }

      // Créer le pretest s'il n'existe pas
      let pretest = await prisma.pretest.findUnique({
        where: { courseId: parsedCourseId },
      });

      if (!pretest) {
        pretest = await prisma.pretest.create({
          data: { courseId: parsedCourseId },
        });
      }

      const question = await prisma.pretestQuestion.create({
        data: {
          pretestId: pretest.id,
          type:      type    || "QCM",
          texte,
          choix:     choix   || [],
          reponse:   typeof reponse === "object" ? JSON.stringify(reponse) : reponse,
          points:    points  || 1,
        },
      });

      return res.status(201).json(question);
    }

    // DELETE — Supprimer une question ou tout le pretest
    if (req.method === "DELETE") {
      const { questionId, courseId } = req.body;

      if (courseId) {
        // Supprimer tout le pretest du cours
        await prisma.pretest.deleteMany({
          where: { courseId: parseInt(courseId) },
        });
        return res.status(200).json({ message: "Pretest vidé avec succès" });
      }

      if (questionId) {
        // Supprimer une seule question
        await prisma.pretestQuestion.delete({
          where: { id: parseInt(questionId) },
        });
        return res.status(200).json({ message: "Question supprimée" });
      }

      return res.status(400).json({ error: "questionId ou courseId manquant" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API PRETEST QUESTIONS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
