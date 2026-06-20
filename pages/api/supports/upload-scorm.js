import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import extractZip from "extract-zip";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for bypassing RLS during upload
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ── Config ──────────────────────────────────────────────────
// Vercel only allows writing to /tmp
const TEMP_DIR = path.join("/tmp", "scorm-uploads");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Multer storage — save ZIP to temp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => {
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
 * Recursively list all files in a directory
 */
function getAllFilesRecursive(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFilesRecursive(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * Determine MIME type basic
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Helper function to process promises in batches
 */
async function processInBatches(items, batchSize, processItem) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processItem));
  }
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
  let extractDir = null;

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

    // 3. Create extraction directory in /tmp
    extractDir = path.join(TEMP_DIR, `extract-${support.id}`);
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    // 4. Extract the ZIP
    await extractZip(tempFilePath, { dir: extractDir });

    // 5. Get all extracted files
    const allFiles = getAllFilesRecursive(extractDir);

    let indexPathFound = null;
    const BUCKET_NAME = "scorm";

    // 6. Upload files to Supabase Storage concurrently in batches
    await processInBatches(allFiles, 20, async (filePath) => {
      // Create a relative path for Supabase Storage (e.g. 12/index.html)
      let relativePath = path.relative(extractDir, filePath).replace(/\\/g, "/");
      const storagePath = `${support.id}/${relativePath}`;

      // Check if this is our entry point
      const lowerName = path.basename(filePath).toLowerCase();
      if (!indexPathFound && (lowerName === "index.html" || lowerName === "index_lms.html" || lowerName === "story.html")) {
        indexPathFound = storagePath;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = getMimeType(filePath);

      const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

      if (error) {
        console.error(`Erreur upload de ${storagePath}:`, error);
        throw new Error(`Erreur lors de l'upload du fichier ${relativePath} vers Supabase`);
      }
    });

    if (!indexPathFound) {
      // Cleanup on failure
      await prisma.support.delete({ where: { id: support.id } });
      throw new Error("Aucun fichier index.html, index_lms.html ou story.html trouvé dans le package. Vérifiez le contenu du ZIP.");
    }

    // 7. Get public URL of the index file
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(indexPathFound);
    const publicUrl = publicUrlData.publicUrl;

    // 8. Update the support with the Supabase public URL
    const updated = await prisma.support.update({
      where: { id: support.id },
      data:  { url: publicUrl },
    });

    // 9. Cleanup temp files
    fs.rmSync(extractDir, { recursive: true, force: true });
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return res.status(201).json(updated);

  } catch (error) {
    // Cleanup temp files on error
    if (extractDir && fs.existsSync(extractDir)) {
      try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch {}
    }
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch {}
    }
    console.error("UPLOAD SCORM ERROR:", error);
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}
