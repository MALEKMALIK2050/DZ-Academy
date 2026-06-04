import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getFeedbackByScore } from "../../../../lib/pretestGenerator";

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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const { answers, courseId } = req.body;

  try {
    const pretest = await prisma.pretest.findUnique({
      where: { id: parseInt(id) },
      include: { questions: true, course: true },
    });

    if (!pretest) return res.status(404).json({ error: "Pretest introuvable" });

    // Calculer le score
    let score = 0;
    for (const question of pretest.questions) {
      if (answers[question.id] === question.reponse) {
        score += question.points;
      }
    }

    const total = pretest.questions.reduce((sum, q) => sum + q.points, 0);

    // Obtenir le feedback
    const feedback = getFeedbackByScore(score, total, pretest.course.annee);

    // Créer/Mettre à jour le résultat
    await prisma.pretestResult.upsert({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId: parseInt(courseId),
        },
      },
      update: {
        score,
        total,
        pourcentage: (score / total) * 100,
        reponses: answers,
      },
      create: {
        studentId: user.id,
        courseId: parseInt(courseId),
        score,
        total,
        pourcentage: (score / total) * 100,
        reponses: answers,
      },
    });

    return res.status(200).json({
      score,
      total,
      feedback,
    });
  } catch (error) {
    console.error("API PRETEST SUBMIT ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}