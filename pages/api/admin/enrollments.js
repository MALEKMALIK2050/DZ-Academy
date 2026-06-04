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
    // GET — toutes les inscriptions
    if (req.method === "GET") {
      const { statut } = req.query;

      const enrollments = await prisma.enrollment.findMany({
        where: statut ? { statut } : {},
        include: {
          student: { select: { id: true, nom: true, prenom: true, email: true, classe: true, niveau: true } },
          course:  { select: { id: true, title: true, matiere: true, niveau: true, annee: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(enrollments);
    }

    // PATCH — valider ou rejeter
    if (req.method === "PATCH") {
      const { enrollmentId, statut, prixPaye, note } = req.body;
      if (!enrollmentId || !statut) return res.status(400).json({ error: "enrollmentId et statut obligatoires" });

      const updated = await prisma.enrollment.update({
        where: { id: parseInt(enrollmentId) },
        data: {
          statut,
          prixPaye:  prixPaye  || null,
          note:      note      || null,
          validePar: user.id,
          valideAt:  new Date(),
        },
      });

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API ADMIN ENROLLMENTS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}