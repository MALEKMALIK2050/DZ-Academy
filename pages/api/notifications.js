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
    // GET — mes notifications
    if (req.method === "GET") {
      const notifications = await prisma.notification.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: "desc" },
        take:    20,
      });
      return res.status(200).json(notifications);
    }

    // PATCH — marquer comme lu
    if (req.method === "PATCH") {
      const { notificationId } = req.body;
      if (notificationId) {
        await prisma.notification.update({
          where: { id: parseInt(notificationId) },
          data:  { lu: true },
        });
      } else {
        // Marquer toutes comme lues
        await prisma.notification.updateMany({
          where: { userId: user.id, lu: false },
          data:  { lu: true },
        });
      }
      return res.status(200).json({ message: "Marqué comme lu" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}