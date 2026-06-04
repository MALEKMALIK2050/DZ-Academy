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
  if (user.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

  try {
    const [courses, enrollments, quizResults, messages] = await Promise.all([

      prisma.course.findMany({
        include: {
          designer:    { select: { id: true, nom: true, prenom: true, role: true } },
          teachers:    { select: { id: true, nom: true, prenom: true, role: true } },
          enrollments: {
            include: {
              student: { select: { id: true, nom: true, prenom: true, classe: true, niveau: true } },
            },
          },
          chapters:  { select: { id: true } },
          quizFinal: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.enrollment.findMany({
        include: {
          student: { select: { id: true, nom: true, prenom: true, classe: true, niveau: true, email: true } },
          course:  { select: { id: true, title: true, matiere: true, annee: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.quizResult.findMany({
        include: {
          student: { select: { id: true, nom: true, prenom: true } },
          quiz: {
            include: {
              chapter: { select: { title: true, courseId: true } },
              course:  { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // ✅ matieres au lieu de matiere
      prisma.user.findMany({
        where: { role: { in: ["TEACHER", "DESIGNER"] } },
        select: {
          id: true, nom: true, prenom: true, role: true,
          matieres: true, // ✅ corrigé
          sentMessages:     { select: { id: true, lu: true, createdAt: true } },
          receivedMessages: { select: { id: true, lu: true, createdAt: true } },
        },
      }),
    ]);

    return res.status(200).json({ courses, enrollments, quizResults, messages });

  } catch (error) {
    console.error("API ADMIN STATS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
}