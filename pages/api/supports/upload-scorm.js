import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import extractZip from "extract-zip";

// ── Config ──────────────────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "scorm");
const TEMP_DIR   = path.join(process.cwd(), "tmp", "scorm-uploads");

// Ensure directories exist
[UPLOAD_DIR, TEMP_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer storage — save ZIP to temp directory first
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 Mo max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".zip") cb(null, true);
    else cb(new Error("Seuls les fichiers .zip sont acceptés"));
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

/**
 * Recursively find a file matching a name inside a directory
 */
function findFileRecursive(dir, targetName) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === targetName.toLowerCase()) {
      return fullPath;
    }
    if (entry.isDirectory()) {
      const found = findFileRecursive(fullPath, targetName);
      if (found) return found;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });

  let tempFilePath = null;

  try {
    // 1. Parse multipart form data
    await runMiddleware(req, res, upload.single("scormFile"));

    const { chapterId, type, nom } = req.body;

    if (!chapterId || !type || !nom) {
      return res.status(400).json({ error: "chapterId, type et nom sont obligatoires" });
    }

    if (!["SCORM", "ARTICULATE"].includes(type)) {
      return res.status(400).json({ error: "Type doit être SCORM ou ARTICULATE" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Fichier ZIP obligatoire" });
    }

    tempFilePath = req.file.path;

    // 2. Create the Support record in DB first to get an ID
    const support = await prisma.support.create({
      data: {
        chapterId: parseInt(chapterId),
        type,
        nom,
        url: "", // Will be updated after extraction
        ordre: 0,
      },
    });

    // 3. Create extraction directory: public/uploads/scorm/{supportId}
    const extractDir = path.join(UPLOAD_DIR, String(support.id));
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    // 4. Extract the ZIP
    await extractZip(tempFilePath, { dir: extractDir });

    // 5. Find the index.html entry point (may be nested in a subfolder)
    const indexPath = findFileRecursive(extractDir, "index.html") 
                   || findFileRecursive(extractDir, "index_lms.html")
                   || findFileRecursive(extractDir, "story.html");

    if (!indexPath) {
      // Cleanup on failure
      fs.rmSync(extractDir, { recursive: true, force: true });
      await prisma.support.delete({ where: { id: support.id } });
      return res.status(400).json({
        error: "Aucun fichier index.html, index_lms.html ou story.html trouvé dans le package. Vérifiez le contenu du ZIP.",
      });
    }

    // 6. Build the relative URL from the public directory
    const relativePath = path.relative(
      path.join(process.cwd(), "public"),
      indexPath
    ).replace(/\\/g, "/");

    const publicUrl = `/${relativePath}`;

    // 7. Update the support with the real URL
    const updated = await prisma.support.update({
      where: { id: support.id },
      data:  { url: publicUrl },
    });

    // 8. Cleanup temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return res.status(201).json(updated);

  } catch (error) {
    // Cleanup temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch {}
    }
    console.error("UPLOAD SCORM ERROR:", error);
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}
