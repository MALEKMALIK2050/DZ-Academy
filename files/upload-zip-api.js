import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import archiver from "archiver";
import extract from "extract-zip";
import prisma from "@/lib/prisma";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const uploadDir = path.join(process.cwd(), "tmp", "uploads");
  const extractDir = path.join(process.cwd(), "tmp", "extracts");

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

  const form = new IncomingForm({ uploadDir, keepExtensions: true, maxFileSize: 100 * 1024 * 1024 });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const { courseId } = Object.values(fields)[0] ? { courseId: Object.values(fields)[0][0] } : {};
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!courseId || !file) {
      return res.status(400).json({ error: "courseId et fichier ZIP obligatoires" });
    }

    if (!file.originalFilename?.endsWith(".zip")) {
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ error: "Veuillez uploader un fichier ZIP" });
    }

    // Vérifier que le course existe et appartient au designer
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: { designerId: true },
    });

    if (!course || course.designerId !== user.id) {
      fs.unlinkSync(file.filepath);
      return res.status(403).json({ error: "Accès refusé à ce cours" });
    }

    // Créer un batch d'import
    const batch = await prisma.importBatch.create({
      data: {
        courseId: parseInt(courseId),
        status: "IN_PROGRESS",
      },
    });

    console.log(`📦 Batch ${batch.id} créé pour le cours ${courseId}`);

    // Extraire le ZIP
    const batchExtractDir = path.join(extractDir, `batch-${batch.id}`);
    if (!fs.existsSync(batchExtractDir)) fs.mkdirSync(batchExtractDir, { recursive: true });

    await extract(file.filepath, { dir: batchExtractDir });
    fs.unlinkSync(file.filepath);

    console.log(`✅ ZIP extrait dans ${batchExtractDir}`);

    // Vérifier les fichiers attendus
    const expectedFiles = {
      chapters: "chapters.xlsx",
      pretest: "pretest.xlsx",
      formative: "formative.xlsx",
      summative: "summative.xlsx",
    };

    const filePaths = {};
    for (const [key, filename] of Object.entries(expectedFiles)) {
      const filePath = path.join(batchExtractDir, filename);
      if (fs.existsSync(filePath)) {
        filePaths[key] = filePath;
        console.log(`📄 ${filename} trouvé`);
      } else {
        console.warn(`⚠️ ${filename} manquant`);
      }
    }

    // Retourner les infos pour le frontend
    return res.status(200).json({
      success: true,
      batchId: batch.id,
      courseId: parseInt(courseId),
      files: {
        chapters: !!filePaths.chapters,
        pretest: !!filePaths.pretest,
        formative: !!filePaths.formative,
        summative: !!filePaths.summative,
      },
      extractDir: batchExtractDir,
      message: "ZIP uploadé et extrait avec succès",
    });

  } catch (error) {
    console.error("ZIP UPLOAD ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
