import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { IncomingForm } from "formidable";
import path from "path";
import fs from "fs";

export const config = { api: { bodyParser: false } };

// Dossier de destination pour les photos de profil
const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function getUser(req) {
  try {
    const cookies = req.headers.cookie || "";
    const match = cookies.match(/token=([^;]+)/);
    if (!match) return null;
    return jwt.verify(match[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Authentification via cookie JWT
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  // Le userId peut venir du query OU on utilise celui du token
  const userId = parseInt(req.query.userId || user.id);
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: "userId invalide" });
  }

  // Sécurité : un user ne peut uploader que sa propre photo (sauf admin)
  if (user.role !== "ADMIN" && user.id !== userId) {
    return res.status(403).json({ error: "Vous ne pouvez modifier que votre propre photo" });
  }

  try {
    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5 MB
      keepExtensions: true,
      filter: ({ mimetype }) => {
        return mimetype && mimetype.startsWith("image/");
      },
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const fileObj = Array.isArray(files.photo) ? files.photo[0] : files.photo;
    if (!fileObj) {
      return res.status(400).json({ error: "Aucune photo reçue. Vérifiez que le fichier est une image valide (JPG, PNG, GIF, WebP)." });
    }

    // Vérifier le type MIME
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(fileObj.mimetype)) {
      // Nettoyer le fichier temporaire
      if (fs.existsSync(fileObj.filepath)) fs.unlinkSync(fileObj.filepath);
      return res.status(400).json({ error: "Format non supporté. Utilisez JPG, PNG, GIF ou WebP." });
    }

    // Générer un nom de fichier unique
    const ext = path.extname(fileObj.originalFilename || ".jpg").toLowerCase();
    const filename = `${userId}-${Date.now()}${ext}`;
    const destPath = path.join(uploadDir, filename);

    // Copier depuis le fichier temporaire vers le dossier public
    fs.copyFileSync(fileObj.filepath, destPath);

    // Nettoyer le fichier temporaire
    if (fs.existsSync(fileObj.filepath)) fs.unlinkSync(fileObj.filepath);

    const photoUrl = `/uploads/profiles/${filename}`;

    // Supprimer l'ancienne photo si elle existe
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { photo: true } });
    if (currentUser?.photo && currentUser.photo.startsWith("/uploads/profiles/")) {
      const oldPath = path.join(process.cwd(), "public", currentUser.photo);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch {}
      }
    }

    // Mettre à jour la BDD
    await prisma.user.update({
      where: { id: userId },
      data: { photo: photoUrl },
    });

    return res.status(200).json({ success: true, photo: photoUrl });

  } catch (error) {
    console.error("❌ Erreur upload photo:", error);
    return res.status(500).json({ error: error.message || "Erreur serveur lors de l'upload" });
  }
}
