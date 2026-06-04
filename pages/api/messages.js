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

  try {
    // GET — messages reçus + envoyés
    if (req.method === "GET") {
      const { withUser } = req.query;

      const where = withUser
        ? {
            OR: [
              { senderId: user.id,   receiverId: parseInt(withUser) },
              { senderId: parseInt(withUser), receiverId: user.id },
            ],
          }
        : {
            OR: [
              { senderId:   user.id },
              { receiverId: user.id },
            ],
          };

      const messages = await prisma.message.findMany({
        where,
        include: {
          sender:   { select: { id: true, nom: true, prenom: true, role: true } },
          receiver: { select: { id: true, nom: true, prenom: true, role: true } },
        },
        orderBy: { createdAt: "asc" }, // ✅ asc pour affichage chat
      });
      return res.status(200).json(messages);
    }

    // POST — envoyer un message
    if (req.method === "POST") {
      const { receiverId, content } = req.body;
      if (!receiverId || !content)
        return res.status(400).json({ error: "receiverId et content obligatoires" });

      const message = await prisma.message.create({
        data: {
          senderId:   user.id,
          receiverId: parseInt(receiverId),
          content,
        },
        include: {
          sender:   { select: { id: true, nom: true, prenom: true, role: true } },
          receiver: { select: { id: true, nom: true, prenom: true, role: true, email: true } },
        },
      });

      // ✅ Étape 9 : Notification de Message Interne
      await sendEmail({
        to: message.receiver.email,
        subject: `Nouveau message de ${message.sender.prenom} ${message.sender.nom}`,
        html: `
          <h1>Vous avez un nouveau message</h1>
          <p>Bonjour ${message.receiver.prenom},</p>
          <p>Vous avez reçu un message interne sur Bouamama Academy.</p>
          <p><strong>De : ${message.sender.prenom} ${message.sender.nom}</strong></p>
          <p><em>"${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"</em></p>
          <p>Connectez-vous pour répondre.</p>
        `,
      });

      return res.status(201).json(message);
    }

    // PATCH — marquer comme lu
    if (req.method === "PATCH") {
      const { messageId } = req.body;
      if (!messageId) return res.status(400).json({ error: "messageId manquant" });

      await prisma.message.update({
        where: { id: parseInt(messageId) },
        data: { lu: true },
      });
      return res.status(200).json({ message: "Marqué comme lu" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API MESSAGES ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}