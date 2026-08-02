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
  if (!user) return res.status(401).json({ error: "غير مسموح" });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "الطريقة غير مسموح بها" });
  }

  const { id } = req.query;
  const { answers, courseId } = req.body;

  try {
    const pretest = await prisma.pretest.findUnique({
      where: { id: parseInt(id) },
      include: { questions: true, course: true },
    });

    if (!pretest) return res.status(404).json({ error: "الاختبار التمهيدي غير موجود" });

    // Calculer le score
    let score = 0;
    for (const question of pretest.questions) {
      if (answers[question.id] === question.reponse) {
        score += question.points;
      }
    }

    const total = pretest.questions.length || pretest.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // Obtenir le feedback
    const feedback = getFeedbackByScore(percentage, 100, pretest.course?.annee);

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
        pourcentage: percentage,
        reponses: answers,
      },
      create: {
        studentId: user.id,
        courseId: parseInt(courseId),
        score,
        total,
        pourcentage: percentage,
        reponses: answers,
      },
    });

    return res.status(200).json({
      score,
      correct: score,
      total,
      percentage,
      pourcentage: percentage,
      feedback,
    });
  } catch (error) {
    console.error("API PRETEST SUBMIT ERROR:", error);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
}
