import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SEUIL_REUSSITE = 50;
const MAX_TENTATIVES = Infinity;

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
  if (user.role !== "STUDENT") return res.status(403).json({ error: "Accès refusé" });

  // GET — vérifier tentatives restantes
  if (req.method === "GET") {
    try {
      const { quizId } = req.query;
      if (!quizId) return res.status(400).json({ error: "quizId manquant" });

      const existing = await prisma.quizResult.findUnique({
        where: { studentId_quizId: { studentId: user.id, quizId: parseInt(quizId) } },
      });

      return res.status(200).json({
        tentatives:         existing?.tentatives || 0,
        maxTentatives:      MAX_TENTATIVES,
        score:              existing?.score || null,
        reussi:             (existing?.score || 0) >= SEUIL_REUSSITE,
        bloque:             (existing?.tentatives || 0) >= MAX_TENTATIVES && (existing?.score || 0) < SEUIL_REUSSITE,
      });
    } catch (error) {
      console.error("GET QUIZ ERROR:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // POST — soumettre quiz
  if (req.method === "POST") {
    try {
      const { quizId, reponses } = req.body;
      if (!quizId || !reponses) return res.status(400).json({ error: "quizId et reponses obligatoires" });

      // Vérifier tentatives existantes
      const existing = await prisma.quizResult.findUnique({
        where: { studentId_quizId: { studentId: user.id, quizId: parseInt(quizId) } },
      });

      // Bloqué
      if (existing && existing.tentatives >= MAX_TENTATIVES && existing.score < SEUIL_REUSSITE) {
        return res.status(200).json({
          score:      existing.score,
          tentatives: existing.tentatives,
          reussi:     false,
          bloque:     true,
          message:    "Contactez votre enseignant pour une remédiation pédagogique obligatoire.",
        });
      }

      // Déjà réussi
      if (existing && existing.score >= SEUIL_REUSSITE) {
        return res.status(200).json({
          score:      existing.score,
          tentatives: existing.tentatives,
          reussi:     true,
          bloque:     false,
          message:    "Vous avez déjà réussi ce quiz !",
        });
      }

      // Charger quiz + questions
      const quiz = await prisma.quiz.findUnique({
        where:   { id: parseInt(quizId) },
        include: { questions: true },
      });
      if (!quiz) return res.status(404).json({ error: "Quiz introuvable" });

      // Calculer score
      let correct = 0;
      const detail = [];

      for (const question of quiz.questions) {
        const repEtudiant = reponses[question.id];
        let isCorrect = false;

        switch (question.type) {
          case "QCM":
          case "VRAI_FAUX":
            isCorrect = repEtudiant === question.reponse;
            break;
          case "QCM_MULTIPLE": {
            const bonnes  = JSON.parse(question.reponse || "[]");
            const donnees = Array.isArray(repEtudiant) ? repEtudiant : [];
            isCorrect = bonnes.length === donnees.length && bonnes.every((b) => donnees.includes(b));
            break;
          }
          case "OUVERTE":
            isCorrect = repEtudiant?.toLowerCase().trim() === question.reponse.toLowerCase().trim();
            break;
          case "GAP": {
            const bonnes  = JSON.parse(question.reponse || "[]");
            const donnees = Array.isArray(repEtudiant) ? repEtudiant : [];
            isCorrect = bonnes.every((b, i) => b.toLowerCase().trim() === (donnees[i] || "").toLowerCase().trim());
            break;
          }
          case "MATCHING": {
            const bonnes = JSON.parse(question.reponse || "{}");
            isCorrect = Object.entries(bonnes).every(([k, v]) => repEtudiant?.[k] === v);
            break;
          }
          case "ORDERING": {
            const bonnes  = JSON.parse(question.reponse || "[]");
            const donnees = Array.isArray(repEtudiant) ? repEtudiant : [];
            isCorrect = bonnes.every((b, i) => b === donnees[i]);
            break;
          }
        }

        if (isCorrect) correct += question.points || 1;
        detail.push({ questionId: question.id, correct: isCorrect, repEtudiant });
      }

      const totalPoints = quiz.questions.reduce((acc, q) => acc + (q.points || 1), 0);
      const score       = totalPoints > 0 ? Math.round((correct / totalPoints) * 100) : 0;
      const tentatives  = (existing?.tentatives || 0) + 1;
      const reussi      = score >= SEUIL_REUSSITE;
      const bloque      = !reussi && tentatives >= MAX_TENTATIVES;

      // Sauvegarder
      await prisma.quizResult.upsert({
        where:  { studentId_quizId: { studentId: user.id, quizId: parseInt(quizId) } },
        update: { score, reponses: detail, tentatives },
        create: { studentId: user.id, quizId: parseInt(quizId), score, reponses: detail, tentatives: 1 },
      });

      return res.status(200).json({
        score,
        correct,
        total:              totalPoints,
        tentatives,
        tentativesRestantes: Math.max(0, MAX_TENTATIVES - tentatives),
        reussi,
        bloque,
        detail,
        message: reussi
          ? "🎉 Excellent ! Vous pouvez passer au chapitre suivant."
          : bloque
            ? "Contactez votre enseignant pour une remédiation pédagogique obligatoire."
            : `Score insuffisant (${score}%). Il vous reste ${MAX_TENTATIVES - tentatives} tentative(s).`,
      });

    } catch (error) {
      console.error("POST QUIZ ERROR:", error);
      return res.status(500).json({ error: "Erreur serveur", detail: error.message });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}