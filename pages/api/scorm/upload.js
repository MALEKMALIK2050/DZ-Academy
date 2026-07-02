// pages/api/scorm/upload.js
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const config = { api: { bodyParser: false } };

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

function detectScormVersion(zipEntries) {
  const manifest = zipEntries.find(e => e.entryName.toLowerCase() === "imsmanifest.xml");
  if (!manifest) return "1.2";
  const content = manifest.getData().toString("utf8");
  if (content.includes("CAM 1.3") || content.includes("2004")) return "2004";
  return "1.2";
}

function findLaunchFile(zipEntries) {
  const priorities = ["story.html", "story_html5.html", "index_lms.html", "index_lms_html5.html", "index.html", "index.htm", "launch.html", "default.html"];
  for (const p of priorities) {
    const found = zipEntries.find(e => e.entryName.toLowerCase() === p);
    if (found) return found.entryName;
  }
  const html = zipEntries.find(e => e.entryName.toLowerCase().endsWith(".html"));
  return html?.entryName || "index.html";
}

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

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
    '.svg': 'image/svg+xml', '.json': 'application/json', '.xml': 'application/xml',
    '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.woff': 'font/woff', '.woff2': 'font/woff2'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function processInBatches(items, batchSize, processItem) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processItem));
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = getUser(req);
  if (!user || user.role !== "DESIGNER") return res.status(401).json({ error: "Non autorisé" });

  if (!supabase) {
    return res.status(500).json({ error: "Supabase non configuré" });
  }

  let extractDir = null;

  try {
    const form = new IncomingForm({ maxFileSize: 200 * 1024 * 1024, keepExtensions: true });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const courseId = parseInt(Array.isArray(fields.courseId) ? fields.courseId[0] : fields.courseId);
    const title    = Array.isArray(fields.title) ? fields.title[0] : (fields.title || "SCORM Package");
    const fileObj  = Array.isArray(files.scormFile) ? files.scormFile[0] : files.scormFile;

    if (!courseId || isNaN(courseId)) return res.status(400).json({ error: "courseId manquant" });
    if (!fileObj) return res.status(400).json({ error: "Fichier ZIP manquant" });

    const zip = new AdmZip(fileObj.filepath);
    const zipEntries = zip.getEntries();

    const version    = detectScormVersion(zipEntries);
    const launchFile = findLaunchFile(zipEntries);

    // Write to /tmp to avoid Vercel read-only filesystem errors
    const TEMP_DIR = path.join("/tmp", "scorm-uploads");
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    
    extractDir = path.join(TEMP_DIR, `scorm-${courseId}-${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });
    zip.extractAllTo(extractDir, true);

    const allFiles = getAllFilesRecursive(extractDir);
    const storagePrefix = `course-${courseId}/${Date.now()}`;
    const BUCKET_NAME = "scorm";

    await processInBatches(allFiles, 20, async (filePath) => {
      let relativePath = path.relative(extractDir, filePath).replace(/\\/g, "/");
      const storagePath = `${storagePrefix}/${relativePath}`;
      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = getMimeType(filePath);

      const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

      if (error) {
        throw new Error(`Erreur lors de l'upload vers Supabase: ${relativePath}`);
      }
    });

    const pkg = await prisma.scormPackage.create({
      data: { courseId, title, version, launchFile, storagePath: storagePrefix },
    });

    // Cleanup temp files
    fs.rmSync(extractDir, { recursive: true, force: true });
    if (fs.existsSync(fileObj.filepath)) fs.unlinkSync(fileObj.filepath);

    return res.status(201).json(pkg);

  } catch (error) {
    if (extractDir && fs.existsSync(extractDir)) {
      try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch {}
    }
    console.error("SCORM UPLOAD ERROR:", error);
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}