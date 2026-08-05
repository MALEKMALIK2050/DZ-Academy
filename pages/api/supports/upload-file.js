import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Temp directory for file uploads
const TEMP_DIR = path.join("/tmp", "support-uploads");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Accepted MIME types and extensions per support type
const ALLOWED_TYPES = {
  PDF:   { mimes: ["application/pdf"], exts: [".pdf"] },
  IMAGE: { mimes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"], exts: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"] },
  PPT:   { mimes: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ], exts: [".ppt", ".pptx"] },
  WORD:  { mimes: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ], exts: [".doc", ".docx"] },
};

// Multer storage — save file to temp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const supportType = req.body?.type || req.headers["x-support-type"];

    // Accept any of the allowed types
    const allAllowedExts = Object.values(ALLOWED_TYPES).flatMap(t => t.exts);
    if (allAllowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Extension non acceptée : ${ext}. Formats autorisés : PDF, Image (jpg/png/gif/webp/svg), PPT/PPTX, DOC/DOCX`));
    }
  },
});

export const config = { api: { bodyParser: false } };

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });
}

function getUser(req) {
  try {
    const cookies = req.headers.cookie || "";
    const match   = cookies.match(/token=([^;]+)/);
    if (!match) return null;
    return jwt.verify(match[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".pdf":  "application/pdf",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".gif":  "image/gif",
    ".webp": "image/webp",
    ".svg":  "image/svg+xml",
    ".ppt":  "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".doc":  "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });

  if (!supabase) {
    return res.status(500).json({ error: "Supabase n'est pas configuré (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquants)." });
  }

  let tempFilePath = null;

  try {
    // 1. Parse multipart form data
    await runMiddleware(req, res, upload.single("supportFile"));

    const { chapterId, type, nom } = req.body;

    if (!chapterId || !type || !nom) {
      return res.status(400).json({ error: "chapterId, type et nom sont obligatoires" });
    }

    if (!["PDF", "IMAGE", "PPT", "WORD"].includes(type)) {
      return res.status(400).json({ error: "Type doit être PDF, IMAGE, PPT ou WORD pour l'upload de fichier" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Fichier obligatoire" });
    }

    tempFilePath = req.file.path;
    const ext    = path.extname(req.file.originalname).toLowerCase();
    const mimeType = getMimeType(tempFilePath);

    // Validate extension matches the declared type
    const allowed = ALLOWED_TYPES[type];
    if (allowed && !allowed.exts.includes(ext)) {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({
        error: `Extension ${ext} non autorisée pour le type ${type}. Extensions acceptées : ${allowed.exts.join(", ")}`,
      });
    }

    // 2. Build Supabase storage path
    const BUCKET_NAME = "supports"; // Separate bucket from SCORM
    const safeName    = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${chapterId}/${Date.now()}-${safeName}`;

    // 3. Upload file to Supabase Storage
    const fileBuffer = fs.readFileSync(tempFilePath);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erreur upload Supabase : ${uploadError.message}`);
    }

    // 4. Get public URL
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    const publicUrl = publicUrlData.publicUrl;

    // 5. Create the Support record in DB
    const support = await prisma.support.create({
      data: {
        chapterId: parseInt(chapterId),
        type,
        nom,
        url: publicUrl,
        ordre: 0,
      },
    });

    // 6. Cleanup temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return res.status(201).json(support);

  } catch (error) {
    // Cleanup temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch {}
    }
    console.error("UPLOAD FILE ERROR:", error);
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}
