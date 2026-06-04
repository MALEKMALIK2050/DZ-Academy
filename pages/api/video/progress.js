// pages/api/video/progress.js
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
    /^([a-zA-Z0-9_-]{11})$/,
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
        where: {
          studentId_supportId: {
            studentId: user.id,
            supportId: parseInt(supportId),
          },
        },
      });

      // Retourner position + progression même si nouveau
      return res.status(200).json({
        progression: progress?.progression || 0,
        completed: progress?.completed || false,
        events: progress?.events || [],
        lastPosition: progress?.lastPosition || 0, // ✅ Position pour reprendre
        duration: progress?.duration || null,
      });
    }

    // POST — mettre à jour progression vidéo
    if (req.method === "POST") {
      const { supportId, progression, event, lastPosition, duration } = req.body;

      if (!supportId) return res.status(400).json({ error: "supportId manquant" });

      // Vérifier support existe
      const support = await prisma.support.findUnique({
        where: { id: parseInt(supportId) },
      });

      if (!support) return res.status(404).json({ error: "Support non trouvé" });

      // Récupérer progression existante
      let existingProgress = await prisma.videoProgress.findUnique({
        where: {
          studentId_supportId: {
            studentId: user.id,
            supportId: parseInt(supportId),
          },
        },
      });

      // Récupérer les events existants
      const currentEvents = existingProgress?.events || [];
      let newEvents = currentEvents;

      // Déterminer si événement de progression à ajouter (25, 50, 75, 100)
      if (event && !currentEvents.includes(event)) {
        newEvents = [...currentEvents, event];
      }

      // Prendre le max de progression (jamais diminuer)
      const newProgression = Math.max(
        existingProgress?.progression || 0,
        progression || 0
      );

      // Considérer complété à 90% ou si event 100 atteint
      const completed = newProgression >= 90 || newEvents.includes(100);

      // Créer ou mettre à jour
      const progress = await prisma.videoProgress.upsert({
        where: {
          studentId_supportId: {
            studentId: user.id,
            supportId: parseInt(supportId),
          },
        },
        update: {
          progression: newProgression,
          events: newEvents,
          completed,
          lastPosition: lastPosition || 0, // ✅ Sauvegarder position
          updatedAt: new Date(),
        },
        create: {
          studentId: user.id,
          supportId: parseInt(supportId),
          progression: newProgression,
          events: newEvents,
          completed,
          lastPosition: lastPosition || 0, // ✅ Initialiser position
        },
      });

      return res.status(200).json({
        success: true,
        progression: progress.progression,
        completed: progress.completed,
        lastPosition: progress.lastPosition,
        events: progress.events,
      });
    }

    // PUT — marquer vidéo comme complétée manuellement
    if (req.method === "PUT") {
      const { supportId } = req.body;

      if (!supportId) return res.status(400).json({ error: "supportId manquant" });

      const progress = await prisma.videoProgress.upsert({
        where: {
          studentId_supportId: {
            studentId: user.id,
            supportId: parseInt(supportId),
          },
        },
        update: {
          progression: 100,
          completed: true,
          events: { push: 100 },
        },
        create: {
          studentId: user.id,
          supportId: parseInt(supportId),
          progression: 100,
          completed: true,
          events: [100],
        },
      });

      return res.status(200).json({
        success: true,
        message: "Vidéo marquée complétée",
        progress,
      });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API VIDEO PROGRESS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
}
