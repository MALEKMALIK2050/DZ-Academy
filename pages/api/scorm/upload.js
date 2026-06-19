// pages/api/scorm/upload.js
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import formidable from "formidable";
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

function detectScormVersion(files) {
  const hasImsManifest = files.some(f => f.entryName === "imsmanifest.xml");
  if (!hasImsManifest) return null;
  const manifest = files.find(f => f.entryName === "imsmanifest.xml");
  const content = manifest.getData().toString("utf8");
  if (content.includes("CAM 1.3") || content.includes("2004")) return "2004";
  return "1.2";
}

function findLaunchFile(files) {
  const priorities = ["index.html", "index.htm", "launch.html", "launch.htm", "default.html"];
  for (const p of priorities) {
    if (files.some(f => f.entryName === p || f.entryName.endsWith("/" + p))) return p;
  }
  return files.find(f => f.entryName.endsWith(".html"))?.entryName || "index.html";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = getUser(req);
  if (!user || user.role !== "DESIGNER") return res.status(401).json({ error: "Non autorisé" });

  const form = formidable({ maxFileSize: 200 * 1024 * 1024 }); // 200MB max

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Erreur parsing: " + err.message });

    try {
      const courseId = parseInt(fields.courseId?.[0] || fields.courseId);
      const title    = fields.title?.[0] || fields.title || "SCORM Package";
      const file     = files.scormFile?.[0] || files.scormFile;

      if (!courseId || !file) return res.status(400).json({ error: "courseId et fichier ZIP requis" });

      // Lire le ZIP
      const zip = new AdmZip(file.filepath);
      const zipEntries = zip.getEntries();

      if (!zipEntries.some(e => e.entryName === "imsmanifest.xml")) {
        return res.status(400).json({ error: "Le fichier ZIP ne contient pas de imsmanifest.xml — ce n'est pas un package SCORM valide." });
      }

      const version    = detectScormVersion(zipEntries);
      const launchFile = findLaunchFile(zipEntries);

      // Extraire dans /public/scorm/<courseId>/<timestamp>/
      const extractDir = path.join(process.cwd(), "public", "scorm", String(courseId), Date.now().toString());
      fs.mkdirSync(extractDir, { recursive: true });
      zip.extractAllTo(extractDir, true);

      // Chemin relatif pour le navigateur
      const relPath = extractDir.replace(path.join(process.cwd(), "public"), "").replace(/\\/g, "/");

      // Sauvegarder en base
      const pkg = await prisma.scormPackage.create({
        data: {
          courseId,
          title,
          version:       version || "1.2",
          launchFile,
          extractedPath: relPath,
        },
      });

      return res.status(201).json(pkg);

    } catch (error) {
      console.error("SCORM UPLOAD ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}