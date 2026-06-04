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

  if (req.method === "GET") {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ error: "courseId manquant" });

    try {
      const progress = await prisma.videoProgress.findMany({
        where: {
          support: {
            chapter: { courseId: parseInt(courseId) },
          },
        },
        include: {
          student: { select: { id: true, nom: true, prenom: true } },
          support: { select: { id: true, nom: true, videoId: true } },
        },
      });
      return res.status(200).json(progress);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}