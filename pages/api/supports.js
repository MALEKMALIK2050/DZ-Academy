import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function extractYouTubeId(url) {
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

  try {
    // GET — Lister les supports d'un chapitre
    if (req.method === "GET") {
      const { chapterId } = req.query;

      if (!chapterId) {
        return res.status(400).json({ error: "chapterId manquant" });
      }

      const supports = await prisma.support.findMany({
        where: { chapterId: parseInt(chapterId) },
        orderBy: { ordre: "asc" },
      });

      return res.status(200).json(supports);
    }

    // POST — Créer un support
    if (req.method === "POST") {
      if (user.role !== "DESIGNER")
        return res.status(403).json({ error: "Accès refusé" });

      const { chapterId, type, nom, url, contenu, ordre } = req.body;

      if (!chapterId || !type || !nom) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      // Extraire videoId si c'est une vidéo YouTube
      let videoId = null;
      if (type === "VIDEO") {
        videoId = extractYouTubeId(url);
      }

      const support = await prisma.support.create({
        data: {
          chapterId: parseInt(chapterId),
          type,
          nom,
          url,
          contenu,
          videoId,
          ordre: ordre || 0,
        },
      });

      return res.status(201).json(support);
    }

    // PUT — Modifier ou réordonner un support
    if (req.method === "PUT") {
      if (user.role !== "DESIGNER")
        return res.status(403).json({ error: "Accès refusé" });

      const { supportId, nom, url, contenu, ordre, type } = req.body;

      if (!supportId) {
        return res.status(400).json({ error: "supportId manquant" });
      }

      const updateData = {};
      if (nom) updateData.nom = nom;
      if (url) updateData.url = url;
      if (contenu) updateData.contenu = contenu;
      if (ordre !== undefined) updateData.ordre = ordre;

      // Extraire videoId si URL change
      if (url && type === "VIDEO") {
        updateData.videoId = extractYouTubeId(url);
      }

      const support = await prisma.support.update({
        where: { id: parseInt(supportId) },
        data: updateData,
      });

      return res.status(200).json(support);
    }

    // DELETE — Supprimer un support
    if (req.method === "DELETE") {
      if (user.role !== "DESIGNER")
        return res.status(403).json({ error: "Accès refusé" });

      const { supportId } = req.body;

      if (!supportId) {
        return res.status(400).json({ error: "supportId manquant" });
      }

      await prisma.support.delete({
        where: { id: parseInt(supportId) },
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API SUPPORTS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
}
