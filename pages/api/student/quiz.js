import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SEUIL_REUSSITE = 75; // 75% pour passer au chapitre suivant
const MAX_TENTATIVES = Infinity; // Tentatives illimitées

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

  if (user.role !== "STUDENT" && user.role !== "TEACHER" && user.role !== "DESIGNER") {
    return res.status(403).json({ error: "Accès refusé" });
  }

  try {
    // GET — infos quiz + tentatives
    if (req.method === "GET") {
      const { quizId } = req.query;
      if (!quizId) return res.status(400).json({ error: "quizId manquant" });

      const quiz = await prisma.quiz.findUnique({
        where: { id: parseInt(quizId) },
        include: { questions: true },
      });
      if (!quiz) return res.status(404).json({ error: "Quiz introuvable" });

      const existing = await prisma.quizResult.findUnique({
        where: { studentId_quizId: { studentId: user.id, quizId: parseInt(quizId) } },
      });

      return res.status(200).json({
        quiz,
        attemptsCount:  existing?.tentatives || 0,
        maxAttempts:    MAX_TENTATIVES,
        seuilReussite:  SEUIL_REUSSITE,
        bestScore:      existing?.score || null,
        dejaReussi:     existing ? existing.score >= SEUIL_REUSSITE : false,
      });
    }

    // POST — soumettre réponses (accepte "answers" ou "reponses")
    if (req.method === "POST") {
      const { quizId, answers, reponses } = req.body;
      const userAnswers = answers || reponses;

      if (!quizId || !userAnswers) {
        return res.status(400).json({ error: "quizId et réponses obligatoires" });
      }

      const quiz = await prisma.quiz.findUnique({
        where: { id: parseInt(quizId) },
        include: { questions: true },
      });
      if (!quiz) return res.status(404).json({ error: "Quiz introuvable" });

      // Calculer le score
      let scoreObtenu = 0;
      let totalPoints = 0;
      const details = [];

      for (const question of quiz.questions) {
        const uAns    = userAnswers[question.id];
        const correct = question.reponse; // champ dans ton schema
        const points  = question.points || 1;
        totalPoints  += points;

        let isCorrect = false;

        switch (question.type) {
          case "QCM":
          case "VRAI_FAUX":
            isCorrect = String(uAns || "").trim().toLowerCase() === String(correct || "").trim().toLowerCase();
            break;
          case "QCM_MULTIPLE": {
            const bonnes  = Array.isArray(correct) ? correct : JSON.parse(correct || "[]");
            const donnees = Array.isArray(uAns) ? uAns : [];
            isCorrect = bonnes.length === donnees.length && bonnes.every(b => donnees.includes(b));
            break;
          }
          case "OUVERTE":
            isCorrect = String(uAns || "").toLowerCase().trim() === String(correct || "").toLowerCase().trim();
            break;
          default:
            isCorrect = String(uAns || "").trim() === String(correct || "").trim();
        }

        if (isCorrect) scoreObtenu += points;
        details.push({ questionId: question.id, userAnswer: uAns, isCorrect, pointsObtenus: isCorrect ? points : 0 });
      }

      const score    = totalPoints > 0 ? Math.round((scoreObtenu / totalPoints) * 100) : 0;
      const reussi   = score >= SEUIL_REUSSITE;

      // Upsert QuizResult
      const existing = await prisma.quizResult.findUnique({
        where: { studentId_quizId: { studentId: user.id, quizId: parseInt(quizId) } },
      });

      const tentatives = (existing?.tentatives || 0) + 1;

      const result = await prisma.quizResult.upsert({
        where:  { studentId_quizId: { studentId: user.id, quizId: parseInt(quizId) } },
        update: { score, reponses: details, tentatives },
        create: { studentId: user.id, quizId: parseInt(quizId), score, reponses: details, tentatives: 1 },
      });

      // Message adapté
      let message;
      if (reussi) {
        message = score === 100
          ? "🏆 Parfait ! Vous pouvez passer au chapitre suivant."
          : "🎉 Bravo ! Score suffisant. Passez au chapitre suivant.";
      } else {
        message = `📚 Score : ${score}%. Il vous faut ${SEUIL_REUSSITE}% pour continuer. Réessayez !`;
      }

      return res.status(201).json({
        score,
        totalPoints,
        reussi,
        seuil:         SEUIL_REUSSITE,
        tentatives,
        maxAttempts:   MAX_TENTATIVES,
        details,
        result,
        message,
      });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API STUDENT QUIZ ERROR:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}