// /api/student/remediation.js
// Gère : envoi message étudiant + consultation + réponse enseignant + déblocage
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SEUIL_REUSSITE = 90;
const MAX_TENTATIVES = 3;

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

  // ─────────────────────────────────────────────────────────────────
  // STUDENT : POST — envoyer demande de remédiation
  // ─────────────────────────────────────────────────────────────────
  if (req.method === "POST" && user.role === "STUDENT") {
    try {
      const { quizId, message } = req.body;
      if (!quizId || !message?.trim())
        return res.status(400).json({ error: "quizId et message obligatoires" });

      // Vérifier que l'étudiant est bien bloqué sur ce quiz
      const quizResult = await prisma.quizResult.findUnique({
        where: { studentId_quizId: { studentId: user.id, quizId: parseInt(quizId) } },
        include: {
          quiz: {
            include: {
              questions: true,
              chapter: {
                include: {
                  course: { select: { id: true, title: true, teacherId: true } },
                },
              },
            },
          },
        },
      });

      if (!quizResult)
        return res.status(404).json({ error: "Résultat de quiz introuvable" });
      if (quizResult.tentatives < MAX_TENTATIVES || quizResult.score >= SEUIL_REUSSITE)
        return res.status(400).json({ error: "Vous n'êtes pas bloqué sur ce quiz" });

      // Vérifier qu'une demande n'existe pas déjà (en attente)
      const demandeExistante = await prisma.remediation.findFirst({
        where: {
          studentId: user.id,
          quizId: parseInt(quizId),
          statut: "EN_ATTENTE",
        },
      });
      if (demandeExistante)
        return res.status(400).json({
          error: "Vous avez déjà une demande en attente pour ce quiz.",
          remediationId: demandeExistante.id,
        });

      const course = quizResult.quiz.chapter?.course;
      if (!course)
        return res.status(404).json({ error: "Cours introuvable" });

      // Créer la demande de remédiation avec le détail des erreurs
      const erreursDetail = (quizResult.reponses || []).map((r) => {
        const question = quizResult.quiz.questions.find((q) => q.id === r.questionId);
        return {
          questionId: r.questionId,
          texte: question?.texte || "",
          repEtudiant: r.repEtudiant,
          bonneReponse: question?.reponse || "",
          correct: r.correct,
        };
      });

      const remediation = await prisma.remediation.create({
        data: {
          studentId: user.id,
          quizId: parseInt(quizId),
          courseId: course.id,
          teacherId: course.teacherId,
          score: quizResult.score,
          messageEtudiant: message.trim(),
          erreursDetail: erreursDetail,
          statut: "EN_ATTENTE",
        },
      });

      // Créer une notification pour l'enseignant
      await prisma.notification.create({
        data: {
          userId: course.teacherId,
          type: "REMEDIATION",
          titre: "Demande de remédiation",
          message: `Un étudiant est bloqué sur le quiz "${quizResult.quiz.titre || "Quiz"}" du cours "${course.title}" (score : ${quizResult.score}%).`,
          lien: `/dashboard/teacher/courses/${course.id}?tab=remediation`,
          remediationId: remediation.id,
          lu: false,
        },
      });

      return res.status(201).json({
        message: "Votre demande a été envoyée à votre enseignant.",
        remediationId: remediation.id,
      });

    } catch (error) {
      console.error("API REMEDIATION POST ERROR:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // STUDENT : GET — voir l'état de sa demande
  // ─────────────────────────────────────────────────────────────────
  if (req.method === "GET" && user.role === "STUDENT") {
    try {
      const { quizId } = req.query;
      if (!quizId) return res.status(400).json({ error: "quizId manquant" });

      const remediation = await prisma.remediation.findFirst({
        where: { studentId: user.id, quizId: parseInt(quizId) },
        orderBy: { createdAt: "desc" },
        include: {
          teacher: { select: { nom: true, prenom: true } },
        },
      });

      return res.status(200).json(remediation || null);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // TEACHER : GET — voir toutes les demandes de remédiation du cours
  // ─────────────────────────────────────────────────────────────────
  if (req.method === "GET" && (user.role === "TEACHER" || user.role === "ADMIN")) {
    try {
      const { courseId, statut } = req.query;
      if (!courseId) return res.status(400).json({ error: "courseId manquant" });

      const where = { courseId: parseInt(courseId) };
      if (statut) where.statut = statut;
      // Vérifier que l'enseignant est bien propriétaire
      if (user.role === "TEACHER") where.teacherId = user.id;

      const remediations = await prisma.remediation.findMany({
        where,
        include: {
          student: { select: { id: true, nom: true, prenom: true, email: true } },
          quiz: { select: { id: true, titre: true, chapter: { select: { title: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(remediations);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // TEACHER : PATCH — répondre + débloquer l'étudiant
  // ─────────────────────────────────────────────────────────────────
  if (req.method === "PATCH" && (user.role === "TEACHER" || user.role === "ADMIN")) {
    try {
      const { remediationId, reponse, debloquer } = req.body;
      if (!remediationId || !reponse?.trim())
        return res.status(400).json({ error: "remediationId et reponse obligatoires" });

      const remediation = await prisma.remediation.findUnique({
        where: { id: parseInt(remediationId) },
        include: { quiz: true },
      });
      if (!remediation)
        return res.status(404).json({ error: "Demande introuvable" });
      if (user.role === "TEACHER" && remediation.teacherId !== user.id)
        return res.status(403).json({ error: "Accès refusé" });

      // Mettre à jour la remédiation
      const updated = await prisma.remediation.update({
        where: { id: parseInt(remediationId) },
        data: {
          reponseEnseignant: reponse.trim(),
          statut: debloquer ? "DEBLOQUE" : "REPONDU",
          debloqueLe: debloquer ? new Date() : null,
          debloqueParId: debloquer ? user.id : null,
        },
      });

      // Si déblocage : reset les tentatives du quiz
      if (debloquer) {
        await prisma.quizResult.update({
          where: {
            studentId_quizId: {
              studentId: remediation.studentId,
              quizId: remediation.quizId,
            },
          },
          data: { tentatives: 0 },
        });
      }

      // Notifier l'étudiant
      await prisma.notification.create({
        data: {
          userId: remediation.studentId,
          type: debloquer ? "DEBLOQUAGE" : "REPONSE_REMEDIATION",
          titre: debloquer ? "Quiz débloqué !" : "Réponse de votre enseignant",
          message: debloquer
            ? `Votre enseignant a répondu et débloqué votre quiz. Vous pouvez repasser le quiz avec 3 nouvelles tentatives.`
            : `Votre enseignant a répondu à votre demande de remédiation.`,
          lien: `/dashboard/student/courses/${remediation.courseId}`,
          remediationId: remediation.id,
          lu: false,
        },
      });

      return res.status(200).json({
        message: debloquer
          ? "Réponse envoyée et étudiant débloqué avec succès."
          : "Réponse envoyée à l'étudiant.",
        remediation: updated,
      });

    } catch (error) {
      console.error("API REMEDIATION PATCH ERROR:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
