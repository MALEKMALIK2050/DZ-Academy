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

  try {
    // GET — devoirs d'un chapitre
    if (req.method === "GET") {
      const { chapterId } = req.query;
      if (!chapterId) return res.status(400).json({ error: "chapterId manquant" });

      const devoirs = await prisma.devoir.findMany({
        where: { chapterId: parseInt(chapterId) },
        include: {
          rendus: {
            include: {
              student: { select: { id: true, nom: true, prenom: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(devoirs);
    }

    // POST — créer devoir (DESIGNER ou TEACHER)
    if (req.method === "POST") {
      if (user.role !== "DESIGNER" && user.role !== "TEACHER")
        return res.status(403).json({ error: "Accès refusé" });

      const { chapterId, titre, consigne, dateLimit } = req.body;
      if (!chapterId || !titre || !consigne || !dateLimit)
        return res.status(400).json({ error: "Tous les champs sont obligatoires" });

      const devoir = await prisma.devoir.create({
        data: {
          chapterId: parseInt(chapterId),
          titre,
          consigne,
          dateLimit: new Date(dateLimit),
        },
      });
      return res.status(201).json(devoir);
    }

    // DELETE — supprimer devoir
    if (req.method === "DELETE") {
      if (user.role !== "DESIGNER" && user.role !== "TEACHER")
        return res.status(403).json({ error: "Accès refusé" });

      const { devoirId } = req.body;
      if (!devoirId) return res.status(400).json({ error: "devoirId manquant" });

      await prisma.devoir.delete({ where: { id: parseInt(devoirId) } });
      return res.status(200).json({ message: "Devoir supprimé" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API DEVOIRS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}