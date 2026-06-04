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
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { quizId } = req.query;

    if (!quizId) {
      return res.status(400).json({ error: "quizId obligatoire" });
    }

    // Récupérer le dernier résultat du student pour ce quiz
    const lastResult = await prisma.quizResult.findFirst({
      where: {
        studentId: user.id,
        quizId: parseInt(quizId),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastResult) {
      return res.status(404).json(null);
    }

    // Parser les corrections
    const corrections = JSON.parse(lastResult.correction || "[]");

    // Compter les tentatives échouées
    const allAttempts = await prisma.quizResult.findMany({
      where: {
        studentId: user.id,
        quizId: parseInt(quizId),
      },
      orderBy: { createdAt: "asc" },
    });

    const failedAttempts = allAttempts.filter((a) => a.score < 70).length;

    // Récupérer le chapitre pour le message
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) },
      select: { chapter: { select: { title: true } } },
    });

    // Déterminer le message
    let message = "";
    if (lastResult.score >= 70) {
      message = `✅ Bravo! Score: ${lastResult.score.toFixed(0)}%`;
    } else if (failedAttempts === 1) {
      message = `⚠️ Score: ${lastResult.score.toFixed(0)}%. Vous pouvez refaire le test!`;
    } else if (failedAttempts >= 2) {
      message = `📚 Tu devrais étudier "${quiz?.chapter?.title || "ce chapitre"}" à nouveau pour passer. Bon courage! 💪`;
    }

    return res.status(200).json({
      score: lastResult.score,
      pointsObtenu: Math.round((lastResult.score / 100) * 
        corrections.reduce((sum, c) => sum + c.points, 0)),
      pointsTotal: corrections.reduce((sum, c) => sum + c.points, 0),
      message,
      canRetry: lastResult.score < 70 && failedAttempts < 2,
      corrections,
      tentative: failedAttempts,
    });

  } catch (error) {
    console.error("API QUIZ RESULTS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
