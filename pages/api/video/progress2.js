import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

// Extraire videoId depuis URL YouTube
export function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // ID direct
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "STUDENT") return res.status(403).json({ error: "Accès refusé" });

  try {
    // GET — récupérer progression d'une vidéo
    if (req.method === "GET") {
      const { supportId } = req.query;
      if (!supportId) return res.status(400).json({ error: "supportId manquant" });

      const progress = await prisma.videoProgress.findUnique({
        where: { studentId_supportId: { studentId: user.id, supportId: parseInt(supportId) } },
      });

      return res.status(200).json(progress || {
        progression: 0, completed: false, events: [], lastPosition: 0
      });
    }

    // POST — mettre à jour progression
    if (req.method === "POST") {
      const { supportId, progression, event, lastPosition } = req.body;
      if (!supportId) return res.status(400).json({ error: "supportId manquant" });

      // Récupérer progression existante
      const existing = await prisma.videoProgress.findUnique({
        where: { studentId_supportId: { studentId: user.id, supportId: parseInt(supportId) } },
      });

      const currentEvents = existing?.events || [];
      const newEvents = event && !currentEvents.includes(event)
        ? [...currentEvents, event]
        : currentEvents;

      const newProgression = Math.max(existing?.progression || 0, progression || 0);
      const completed      = newProgression >= 90 || newEvents.includes(100);

      const progress = await prisma.videoProgress.upsert({
        where:  { studentId_supportId: { studentId: user.id, supportId: parseInt(supportId) } },
        update: { progression: newProgression, events: newEvents, completed, lastPosition: lastPosition || 0 },
        create: {
          studentId:    user.id,
          supportId:    parseInt(supportId),
          progression:  newProgression,
          events:       newEvents,
          completed,
          lastPosition: lastPosition || 0,
        },
      });

      return res.status(200).json(progress);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API VIDEO PROGRESS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}