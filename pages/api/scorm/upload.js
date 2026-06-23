// pages/api/scorm/upload.js
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export const config = { api: { bodyParser: false } };

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

function detectScormVersion(zipEntries) {
  const manifest = zipEntries.find(e => e.entryName === "imsmanifest.xml");
  if (!manifest) return "1.2";
  const content = manifest.getData().toString("utf8");
  if (content.includes("CAM 1.3") || content.includes("2004")) return "2004";
  return "1.2";
}

function findLaunchFile(zipEntries) {
  const priorities = ["index.html", "index.htm", "launch.html", "default.html"];
  for (const p of priorities) {
    if (zipEntries.some(e => e.entryName === p)) return p;
  }
  const html = zipEntries.find(e => e.entryName.endsWith(".html"));
  return html?.entryName || "index.html";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = getUser(req);
  if (!user || user.role !== "DESIGNER") return res.status(401).json({ error: "Non autorisé" });

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

    if (!zipEntries.some(e => e.entryName === "imsmanifest.xml")) {
      return res.status(400).json({ error: "imsmanifest.xml introuvable — ce n'est pas un package SCORM valide." });
    }

    const version    = detectScormVersion(zipEntries);
    const launchFile = findLaunchFile(zipEntries);

    const extractDir = path.join(process.cwd(), "public", "scorm", String(courseId), Date.now().toString());
    fs.mkdirSync(extractDir, { recursive: true });
    zip.extractAllTo(extractDir, true);

    const relPath = extractDir.replace(path.join(process.cwd(), "public"), "").replace(/\\/g, "/");

    const pkg = await prisma.scormPackage.create({
      data: { courseId, title, version, launchFile, extractedPath: relPath },
    });

    return res.status(201).json(pkg);

  } catch (error) {
    console.error("SCORM UPLOAD ERROR:", error);
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}