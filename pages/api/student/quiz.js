import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SEUIL_REUSSITE = 75; // 75% pour passer au chapitre suivant
const MAX_TENTATIVES_FORMATIF = 3; // 3 tentatives pour les quiz formatifs
const MAX_TENTATIVES_SOMMATIF = Infinity; // Tentatives illimitées (ou autre selon besoin)

function getUser(req) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
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
        include: { 
          questions: true,
          chapter: { select: { courseId: true, ordre: true } }
        },
      });
      if (!quiz) return res.status(404).json({ error: "Quiz introuvable" });

      const existing = await prisma.quizResult.findUnique({
        where: { studentId_quizId: { studentId: user.id, quizId: parseInt(quizId) } },
      });

      let nextChapterId = null;
      let nextChapterTitle = null;
      let nextChapterNumber = null;
      if (quiz.chapter) {
        const nextChapter = await prisma.chapter.findFirst({
          where: { courseId: quiz.chapter.courseId, ordre: { gt: quiz.chapter.ordre } },
          orderBy: { ordre: 'asc' },
          select: { id: true, title: true, ordre: true }
        });
        if (nextChapter) {
          nextChapterId = nextChapter.id;
          nextChapterTitle = nextChapter.title;
          
          const chapterNumber = await prisma.chapter.count({
            where: { courseId: quiz.chapter.courseId, ordre: { lte: nextChapter.ordre } }
          });
          nextChapterNumber = chapterNumber;
        }
      }

      const maxAttempts = quiz.type === "FORMATIF" ? MAX_TENTATIVES_FORMATIF : MAX_TENTATIVES_SOMMATIF;

      return res.status(200).json({
        quiz,
        attemptsCount:  existing?.tentatives || 0,
        maxAttempts:    maxAttempts,
        seuilReussite:  SEUIL_REUSSITE,
        bestScore:      existing?.score || null,
        dejaReussi:     existing ? existing.score >= SEUIL_REUSSITE : false,
        nextChapterId:  nextChapterId,
        nextChapterTitle: nextChapterTitle,
        nextChapterNumber: nextChapterNumber,
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
        include: { 
          questions: true,
          chapter: { select: { courseId: true, ordre: true, id: true } }
        },
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

      const maxAttempts = quiz.type === "FORMATIF" ? MAX_TENTATIVES_FORMATIF : MAX_TENTATIVES_SOMMATIF;

      let message;
      let isReset = false;
      let nextChapterId = null;
      let nextChapterTitle = null;
      let nextChapterNumber = null;

      if (reussi) {
        message = score === 100
          ? "🏆 Parfait ! Vous pouvez passer au chapitre suivant."
          : "🎉 Bravo ! Score suffisant. Passez au chapitre suivant.";
        
        if (quiz.chapter) {
          const nextChapter = await prisma.chapter.findFirst({
            where: { courseId: quiz.chapter.courseId, ordre: { gt: quiz.chapter.ordre } },
            orderBy: { ordre: 'asc' },
            select: { id: true, title: true, ordre: true }
          });
          if (nextChapter) {
            nextChapterId = nextChapter.id;
            nextChapterTitle = nextChapter.title;

            const chapterNumber = await prisma.chapter.count({
              where: { courseId: quiz.chapter.courseId, ordre: { lte: nextChapter.ordre } }
            });
            nextChapterNumber = chapterNumber;
          }
          
          // Marquer le chapitre actuel comme lu et mettre à jour la progression de l'enrollment
          await prisma.chapterProgress.upsert({
            where:  { studentId_chapterId: { studentId: user.id, chapterId: quiz.chapter.id } },
            update: { lu: true, luAt: new Date() },
            create: { studentId: user.id, chapterId: quiz.chapter.id, lu: true, luAt: new Date() },
          });
          
          const courseData = await prisma.course.findUnique({
            where: { id: quiz.chapter.courseId },
            include: { chapters: { select: { id: true } } },
          });
          
          if (courseData && courseData.chapters.length > 0) {
            const totalChapters = courseData.chapters.length;
            const doneChapters  = await prisma.chapterProgress.count({
              where: { studentId: user.id, chapterId: { in: courseData.chapters.map((c) => c.id) }, lu: true },
            });
            const progression = Math.round((doneChapters / totalChapters) * 100);
            const completed   = progression === 100;
            
            await prisma.enrollment.updateMany({
              where: { studentId: user.id, courseId: quiz.chapter.courseId },
              data:  { progression, completed },
            });
          }
        }
      } else {
        if (tentatives >= maxAttempts && quiz.type === "FORMATIF") {
          message = `📚 Vous avez échoué ${maxAttempts} fois. La progression de ce chapitre a été réinitialisée. Vous devez le recommencer.`;
          isReset = true;
          
          if (quiz.chapter) {
            // Remise à zéro de la progression du chapitre
            await prisma.chapterProgress.updateMany({
              where: { studentId: user.id, chapterId: quiz.chapter.id },
              data: { lu: false }
            });
            // Supprimer le QuizResult pour réinitialiser les tentatives
            await prisma.quizResult.delete({
              where: { studentId_quizId: { studentId: user.id, quizId: parseInt(quizId) } }
            });
            // Optionnel: On pourrait aussi supprimer les VideoProgress pour les supports de ce chapitre
            const supports = await prisma.support.findMany({
              where: { chapterId: quiz.chapter.id },
              select: { id: true }
            });
            if (supports.length > 0) {
              await prisma.videoProgress.deleteMany({
                where: { 
                  studentId: user.id, 
                  supportId: { in: supports.map(s => s.id) } 
                }
              });
            }
          }
        } else {
          message = `📚 Score : ${score}%. Il vous faut ${SEUIL_REUSSITE}% pour continuer. Il vous reste ${maxAttempts - tentatives} tentative(s).`;
        }
      }

      return res.status(201).json({
        score,
        totalPoints,
        reussi,
        seuil:         SEUIL_REUSSITE,
        tentatives:    isReset ? 0 : tentatives,
        maxAttempts:   maxAttempts,
        details,
        result,
        message,
        isReset,
        nextChapterId,
        nextChapterTitle,
        nextChapterNumber
      });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API STUDENT QUIZ ERROR:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}