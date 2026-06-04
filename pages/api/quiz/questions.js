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
    if (req.method === "POST") {
      const { chapterId, courseId, type, texte, choix, reponse, points } = req.body;

      if (!texte) {
        return res.status(400).json({ error: "texte obligatoire" });
      }

      let quiz;
      if (chapterId) {
        quiz = await prisma.quiz.upsert({
          where: { chapterId: parseInt(chapterId) },
          update: {},
          create: { type: "FORMATIF", chapterId: parseInt(chapterId) },
        });
      } else if (courseId) {
        quiz = await prisma.quiz.upsert({
          where: { courseId: parseInt(courseId) },
          update: {},
          create: { type: "SOMMATIF", courseId: parseInt(courseId) },
        });
      } else {
        return res.status(400).json({ error: "chapterId ou courseId requis" });
      }

      const question = await prisma.question.create({
        data: {
          quizId:  quiz.id,
          type:    type    || "QCM",
          texte,
          choix:   choix   || [],
          reponse: typeof reponse === "object" ? JSON.stringify(reponse) : reponse,
          points:  points  || 1,
        },
      });

      return res.status(201).json(question);
    }

    if (req.method === "DELETE") {
      const { questionId, courseId, chapterId } = req.body;

      if (courseId) {
        await prisma.quiz.deleteMany({ where: { courseId: parseInt(courseId), type: "SOMMATIF" } });
        return res.status(200).json({ message: "Test sommatif vidé avec succès" });
      }

      if (chapterId) {
        await prisma.quiz.deleteMany({ where: { chapterId: parseInt(chapterId), type: "FORMATIF" } });
        return res.status(200).json({ message: "Test formatif vidé avec succès" });
      }

      if (questionId) {
        await prisma.question.delete({ where: { id: parseInt(questionId) } });
        return res.status(200).json({ message: "Question supprimée" });
      }

      return res.status(400).json({ error: "questionId, courseId ou chapterId manquant" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API QUIZ QUESTIONS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}