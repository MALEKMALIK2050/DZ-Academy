// pages/api/notifications/admin.js
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
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });

  try {
    const { courseId, type } = req.body;

    // Trouver le cours
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: { title: true },
    });

    // Trouver tous les admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", active: true },
      select: { id: true },
    });

    // Trouver l'étudiant
    const student = await prisma.user.findUnique({
      where: { id: user.id },
      select: { nom: true, prenom: true },
    });

    // Créer une notification pour chaque admin
    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId:  admin.id,
            type:    "DEMANDE_INSCRIPTION",
            contenu: `${student.prenom} ${student.nom} demande l'accès au cours "${course?.title || "Cours"}"`,
            lien:    `/dashboard/admin/enrollments`,
            lu:      false,
          },
        })
      )
    );

    return res.status(200).json({ message: "Notification envoyée" });
  } catch (error) {
    console.error("NOTIFICATION ADMIN ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
