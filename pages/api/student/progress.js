import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/mail";

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

  // GET — récupérer progression chapitres d'un cours
  if (req.method === "GET") {
    try {
      const { courseId } = req.query;
      if (!courseId) return res.status(400).json({ error: "courseId manquant" });

      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        include: { chapters: { select: { id: true } } },
      });

      const progress = await prisma.chapterProgress.findMany({
        where: {
          studentId: user.id,
          chapterId: { in: course.chapters.map((c) => c.id) },
        },
      });

      const chapterProgress = {};
      progress.forEach((p) => {
        chapterProgress[p.chapterId] = { lu: p.lu, luAt: p.luAt };
      });

      return res.status(200).json({ chapterProgress });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // POST — marquer chapitre comme lu
  if (req.method === "POST") {
    try {
      const { chapterId, courseId } = req.body;
      if (!chapterId || !courseId) return res.status(400).json({ error: "chapterId et courseId obligatoires" });

      await prisma.chapterProgress.upsert({
        where:  { studentId_chapterId: { studentId: user.id, chapterId: parseInt(chapterId) } },
        update: { lu: true, luAt: new Date() },
        create: { studentId: user.id, chapterId: parseInt(chapterId), lu: true, luAt: new Date() },
      });

      const course = await prisma.course.findUnique({
        where:   { id: parseInt(courseId) },
        include: { chapters: { select: { id: true } } },
      });

      const totalChapters = course.chapters.length;
      const doneChapters  = await prisma.chapterProgress.count({
        where: { studentId: user.id, chapterId: { in: course.chapters.map((c) => c.id) }, lu: true },
      });

      const progression = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;
      const completed   = progression === 100;

      await prisma.enrollment.updateMany({
        where: { studentId: user.id, courseId: parseInt(courseId) },
        data:  { progression, completed },
      });

      // ✅ Étape 6 : Notification de réussite (Attestation)
      if (completed) {
        await sendEmail({
          to: user.email,
          subject: `Félicitations ! Vous avez terminé le cours : ${course.title}`,
          html: `
            <h1>Félicitations !</h1>
            <p>Bonjour,</p>
            <p>Vous avez terminé 100% du cours <strong>"${course.title}"</strong>.</p>
            <p>Votre attestation de réussite sera générée et jointe prochainement (ou disponible dans votre espace personnel).</p>
            <p>Bravo pour votre assiduité !</p>
          `,
        });
      }

      return res.status(200).json({ progression, completed });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}