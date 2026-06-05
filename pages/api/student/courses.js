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

  const studentId = parseInt(user.id); // ✅ garantir un Int

  try {
    if (req.method === "GET") {
      const { niveau, annee, matiere } = req.query;
      console.log("Filtres reçus:", { niveau, annee, matiere });

      const where = { status: "PUBLISHED" }; // ✅ remettre
      if (niveau)  where.niveau  = { equals: niveau,  mode: "insensitive" };
      if (annee)   where.annee   = { equals: annee,   mode: "insensitive" };
      if (matiere) where.matiere = { equals: matiere, mode: "insensitive" };

      const [catalogue, enrollments] = await Promise.all([
        prisma.course.findMany({
          where,
          include: {
            designer:    { select: { nom: true, prenom: true } },
            teachers:    { select: { id: true, nom: true, prenom: true } },
            chapters:    { select: { id: true } },
            enrollments: {
              where:  { studentId }, // ✅ utilise studentId parsé
              select: { id: true, progression: true, completed: true, statut: true, typePaiement: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.enrollment.findMany({
          where: { studentId }, // ✅ utilise studentId parsé
          include: {
            course: {
              include: {
                chapters: { select: { id: true } },
                teachers: { select: { id: true, nom: true, prenom: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      console.log("Where clause:", where); // ✅
      console.log("catalogue count:", catalogue.length);     // ✅ debug
      console.log("enrollments count:", enrollments.length); // ✅ debug
      console.log("Cours trouvés:", catalogue.length);
      catalogue.forEach(c => console.log("  -", c.title, c.niveau, c.annee, c.matiere, c.status));

      return res.status(200).json({ catalogue, enrollments });
    }

    if (req.method === "POST") {
      const { courseId, typePaiement } = req.body;
      if (!courseId) return res.status(400).json({ error: "courseId manquant" });

      const courseIdInt = parseInt(courseId);

      // Vérifier que le cours existe et est publié
      const course = await prisma.course.findFirst({
        where: { id: courseIdInt, status: "PUBLISHED" },
      });
      if (!course) return res.status(404).json({ error: "Cours introuvable" });

      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId: courseIdInt } },
      });
      if (existing) return res.status(400).json({ error: "Demande déjà envoyée", statut: existing.statut });

      const enrollment = await prisma.enrollment.create({
        data: {
          studentId,
          courseId:     courseIdInt,
          statut:       "EN_ATTENTE",
          typePaiement: typePaiement || "COURS_SEUL",
        },
      });
      return res.status(201).json(enrollment);
    }

    if (req.method === "DELETE") {
      const { courseId } = req.body;
      if (!courseId) return res.status(400).json({ error: "courseId manquant" });

      const courseIdInt = parseInt(courseId);
      const course = await prisma.course.findUnique({ where: { id: courseIdInt } });

      await prisma.enrollment.deleteMany({
        where: {
          studentId,
          courseId: courseIdInt,
          statut:   "EN_ATTENTE",
        },
      });

      // ✅ Étape 8 : Notification Désinscription (Confirmation)
      await sendEmail({
        to: user.email,
        subject: `Désinscription confirmée : ${course?.title || "Cours"}`,
        html: `
          <h1>Désinscription confirmée</h1>
          <p>Bonjour,</p>
          <p>Votre demande d'inscription au cours <strong>"${course?.title || "le cours"}"</strong> a été annulée ou supprimée.</p>
          <p>Vos accès à ce contenu sont désormais suspendus et vous ne recevrez plus de rappels pour ce cours.</p>
        `,
      });

      return res.status(200).json({ message: "Demande annulée" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API STUDENT COURSES ERROR:", error.message);
    return res.status(500).json({ error: error.message }); // ✅ retourne l'erreur réelle
  }
}