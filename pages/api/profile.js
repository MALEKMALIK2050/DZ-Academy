import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return res.status(401).json({ error: "Non autorisé" });
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userId = parseInt(user.id);

    if (req.method === "GET") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      return res.status(200).json(dbUser);
    }

    if (req.method === "PATCH") {
      const { telephone, adresse, dateNaissance, photo } = req.body;
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { telephone, adresse, dateNaissance, photo }
      });
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Erreur API Profile:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
