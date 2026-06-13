import prisma from "@/lib/prisma";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const userId = req.query.userId || "user";
    const unique = `${userId}-${Date.now()}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont acceptées"));
    }
  },
});

export const config = {
  api: { bodyParser: false },
};

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId requis" });

  try {
    await runMiddleware(req, res, upload.single("photo"));

    if (!req.file) {
      return res.status(400).json({ error: "Aucune photo reçue" });
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { photo: photoUrl },
    });

    return res.status(200).json({ success: true, photo: photoUrl });
  } catch (error) {
    console.error("❌ Erreur upload photo:", error);
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}
