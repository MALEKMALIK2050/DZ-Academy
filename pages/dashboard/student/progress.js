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
  if (user.role !== "STUDENT") return res.status(403).json({ error: "Accès refusé" });

  try {
    // POST — marquer chapitre comme lu
    if (req.method === "POST") {
      const { chapterId, courseId } = req.body;
      if (!chapterId || !courseId) return res.status(400).json({ error: "chapterId et courseId obligatoires" });

      // Marquer chapitre lu
      await prisma.chapterProgress.upsert({
        where: { studentId_chapterId: { studentId: user.id, chapterId: parseInt(chapterId) } },
        update: { lu: true, luAt: new Date() },
        create: { studentId: user.id, chapterId: parseInt(chapterId), lu: true, luAt: new Date() },
      });

      // Calculer progression du cours
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        include: { chapters: { select: { id: true } } },
      });

      const totalChapters = course.chapters.length;
      const doneChapters  = await prisma.chapterProgress.count({
        where: { studentId: user.id, chapterId: { in: course.chapters.map((c) => c.id) }, lu: true },
      });

      const progression = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;
      const completed   = progression === 100;

      // Mettre à jour enrollment
      await prisma.enrollment.updateMany({
        where: { studentId: user.id, courseId: parseInt(courseId) },
        data:  { progression, completed },
      });

      return res.status(200).json({ progression, completed });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API STUDENT PROGRESS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}