import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SEUIL_REUSSITE = 50; 
const MAX_TENTATIVES = Infinity; 

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
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  if (user.role !== "STUDENT" && user.role !== "TEACHER" && user.role !== "DESIGNER") {
    return res.status(403).json({ error: "Accès refusé" });
  }

  const { method } = req;

  try {
    if (method === "GET") {
      const { quizId } = req.query;
      if (!quizId) {
        return res.status(400).json({ error: "quizId manquant" });
      }

      const quiz = await prisma.quiz.findUnique({
        where: { id: parseInt(quizId) },
        include: {
          questions: {
            orderBy: { ordre: "asc" }
          }
        }
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz introuvable" });
      }

      const attemptsCount = await prisma.quizAttempt.count({
        where: {
          quizId: parseInt(quizId),
          studentId: user.id
        }
      });

      const bestAttempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId: parseInt(quizId),
          studentId: user.id
        },
        orderBy: { score: "desc" }
      });

      return res.status(200).json({
        quiz,
        attemptsCount,
        maxAttempts: MAX_TENTATIVES,
        seuilReussite: SEUIL_REUSSITE,
        bestScore: bestAttempt ? bestAttempt.score : null,
        dejaReussi: bestAttempt ? bestAttempt.score >= SEUIL_REUSSITE : false
      });
    }

    if (method === "POST") {
      const { quizId, answers } = req.body;
      if (!quizId || !answers) {
        return res.status(400).json({ error: "quizId et answers requis" });
      }

      const quiz = await prisma.quiz.findUnique({
        where: { id: parseInt(quizId) },
        include: { questions: true }
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz introuvable" });
      }

      const attemptsCount = await prisma.quizAttempt.count({
        where: {
          quizId: parseInt(quizId),
          studentId: user.id
        }
      });

      if (attemptsCount >= MAX_TENTATIVES) {
        return res.status(403).json({ error: "Nombre maximum de tentatives épuisé !" });
      }

      let scoreObtenu = 0;
      let totalPoints = 0;
      const detailsReponses = [];

      for (const question of quiz.questions) {
        const qId = question.id;
        const uAns = answers[qId];
        const correctAnswers = question.reponseCorrecte;
        const qPoints = question.points || 1;
        totalPoints += qPoints;

        let isCorrect = false;

        if (question.type === "QCM" || question.type === "VRAI_FAUX") {
          isCorrect = String(uAns).trim().toLowerCase() === String(correctAnswers).trim().toLowerCase();
        } else if (question.type === "QCM_MULTIPLE") {
          const uArr = Array.isArray(uAns) ? uAns.map(x => String(x).trim().toLowerCase()).sort() : [];
          const cArr = Array.isArray(correctAnswers) ? correctAnswers.map(x => String(x).trim().toLowerCase()).sort() : [String(correctAnswers).trim().toLowerCase()];
          isCorrect = JSON.stringify(uArr) === JSON.stringify(cArr);
        } else if (question.type === "OUVERTE") {
          const keywords = String(correctAnswers).split(";").map(kw => kw.trim().toLowerCase());
          isCorrect = keywords.some(kw => String(uAns || "").toLowerCase().includes(kw));
        } else {
          isCorrect = String(uAns).trim() === String(correctAnswers).trim();
        }

        if (isCorrect) scoreObtenu += qPoints;

        detailsReponses.push({
          questionId: qId,
          userAnswer: uAns,
          isCorrect,
          pointsObtenus: isCorrect ? qPoints : 0
        });
      }

      const scorePercentage = totalPoints > 0 ? Math.round((scoreObtenu / totalPoints) * 100) : 0;
      const reussi = scorePercentage >= SEUIL_REUSSITE;

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: parseInt(quizId),
          studentId: user.id,
          score: scorePercentage,
          conforme: reussi,
          reponses: JSON.stringify(detailsReponses),
          dateTentative: new Date()
        }
      });

      return res.status(201).json({
        attemptId: attempt.id,
        score: scorePercentage,
        totalPoints,
        reussi,
        seuil: SEUIL_REUSSITE,
        attemptsCount: attemptsCount + 1,
        maxAttempts: MAX_TENTATIVES,
        details: detailsReponses
      });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API STUDENT QUIZ SUBMISSION ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}