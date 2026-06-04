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
    // GET — messages d'un groupe
    if (req.method === "GET") {
      const { groupType } = req.query;
      if (!groupType) return res.status(400).json({ error: "groupType manquant" });

      const messages = await prisma.groupMessage.findMany({
        where:   { groupType },
        include: { sender: { select: { id: true, nom: true, prenom: true, role: true } } },
        orderBy: { createdAt: "asc" },
      });

      return res.status(200).json(messages);
    }

    // POST — envoyer message de groupe
    if (req.method === "POST") {
      const { groupType, content } = req.body;
      if (!groupType || !content) return res.status(400).json({ error: "groupType et content obligatoires" });

      const message = await prisma.groupMessage.create({
        data: { groupType, content, senderId: user.id },
        include: { sender: { select: { id: true, nom: true, prenom: true, role: true } } },
      });

      return res.status(201).json(message);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API CHAT GROUP ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}