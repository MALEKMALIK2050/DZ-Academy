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
    // GET — messages privés
    if (req.method === "GET") {
      const { contactId } = req.query;
      if (!contactId) return res.status(400).json({ error: "contactId manquant" });

      const userId = parseInt(user.id);
      const otherUserId = parseInt(contactId);

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        include: {
          sender: { select: { id: true, nom: true, prenom: true, role: true } },
          receiver: { select: { id: true, nom: true, prenom: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return res.status(200).json(messages);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API CHAT PRIVATE ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}