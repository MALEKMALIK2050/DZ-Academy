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
  if (user.role !== "TEACHER" && user.role !== "DESIGNER")
    return res.status(403).json({ error: "Accès refusé" });

  if (req.method === "GET") {
    try {
      const teacher = await prisma.user.findUnique({
        where: { id: user.id },
        select: { matieres: true, niveaux: true, classe: true },
      });

      // Enrollments avec infos élèves
      const enrollments = await prisma.enrollment.findMany({
        where: { course: { teachers: { some: { id: parseInt(user.id) } } } },
        include: {
          student: { select: { id: true, nom: true, prenom: true, classe: true, niveau: true, email: true } },
          course: { select: { id: true, title: true, matiere: true, annee: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

      // Résultats quiz
      const quizResults = await prisma.quizResult.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          student: { select: { id: true, nom: true, prenom: true } },
          quiz: {
            include: {
              chapter: { select: { title: true, courseId: true } },
              course: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      // Devoirs
      const devoirs = await prisma.devoir.findMany({
        where: {
          chapter: {
            course: {
              OR: [
                { teachers: { some: { id: parseInt(user.id) } } },
                {
                  status: "PUBLISHED",
                  matiere: { in: teacher?.matieres || [] },
                  niveau: { in: teacher?.niveaux || [] },
                  ...(teacher?.classe && { annee: teacher.classe }),
                },
              ],
            },
          },
        },
        include: {
          chapter: { select: { title: true, courseId: true } },
          rendus: {
            include: {
              student: { select: { id: true, nom: true, prenom: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Progression par chapitre
      const chapterProgress = await prisma.chapterProgress.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          chapter: { select: { id: true, title: true, courseId: true } },
          student: { select: { id: true, nom: true, prenom: true } },
        },
      });



      // Messages échangés avec les élèves
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: { in: studentIds } },
            { senderId: { in: studentIds }, receiverId: user.id },
          ],
        },
        select: {
          id: true, senderId: true, receiverId: true,
          content: true, lu: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Stats par élève
      const studentStats = studentIds.map((studentId) => {
        const sesEnrollments = enrollments.filter((e) => e.studentId === studentId);
        const sesQuizResults = quizResults.filter((r) => r.studentId === studentId);
        const sesChaptersDone = chapterProgress.filter((p) => p.studentId === studentId && p.lu);
        const sesMessages = messages.filter((m) => m.senderId === studentId || m.receiverId === studentId);
        const scoresMoy = sesQuizResults.length
          ? (sesQuizResults.reduce((acc, r) => acc + r.score, 0) / sesQuizResults.length).toFixed(1)
          : null;

        const student = sesEnrollments[0]?.student;

        return {
          student,
          enrollments: sesEnrollments,
          quizCount: sesQuizResults.length,
          scoreMoyen: scoresMoy,
          chapitresLus: sesChaptersDone.length,
          messagesCount: sesMessages.length,
          nonLus: sesMessages.filter((m) => m.receiverId === user.id && !m.lu).length,
          derniereActivite: sesQuizResults[0]?.createdAt || sesChaptersDone[0]?.luAt || null,
        };
      });

      return res.status(200).json({
        enrollments,
        quizResults,
        chapterProgress,
        studentStats,
        devoirs,
      });

    } catch (error) {
      console.error("TEACHER STUDENTS ERROR:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}