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
    // GET — catalogue cours publiés + mes inscriptions
    if (req.method === "GET") {
      const { niveau, annee, matiere } = req.query;

      // Cours publiés filtrés
      const where = { status: "PUBLISHED" };
      if (niveau)  where.niveau  = niveau;
      if (annee)   where.annee   = annee;
      if (matiere) where.matiere = matiere;

      const [catalogue, enrollments] = await Promise.all([
        prisma.course.findMany({
          where,
          include: {
            designer:    { select: { nom: true, prenom: true } },
            teacher:     { select: { nom: true, prenom: true } },
            chapters:    { select: { id: true } },
            enrollments: { where: { studentId: user.id }, select: { id: true, progression: true, completed: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.enrollment.findMany({
          where: { studentId: user.id },
          include: {
            course: {
              include: {
                chapters:    { select: { id: true } },
                teacher:     { select: { id: true, nom: true, prenom: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return res.status(200).json({ catalogue, enrollments });
    }

    // POST — s'inscrire à un cours
    if (req.method === "POST") {
      const { courseId } = req.body;
      if (!courseId) return res.status(400).json({ error: "courseId manquant" });

      // Vérifier si déjà inscrit
      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: user.id, courseId: parseInt(courseId) } },
      });
      if (existing) return res.status(400).json({ error: "Déjà inscrit à ce cours" });

      const enrollment = await prisma.enrollment.create({
        data: { studentId: user.id, courseId: parseInt(courseId) },
      });
      return res.status(201).json(enrollment);
    }

    // DELETE — se désinscrire
    if (req.method === "DELETE") {
      const { courseId } = req.body;
      if (!courseId) return res.status(400).json({ error: "courseId manquant" });

      await prisma.enrollment.deleteMany({
        where: { studentId: user.id, courseId: parseInt(courseId) },
      });
      return res.status(200).json({ message: "Désinscrit" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API STUDENT COURSES ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}