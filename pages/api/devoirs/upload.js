import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendEmail } from "@/lib/mail";

const uploadDir = path.join(process.cwd(), "public", "uploads", "devoirs");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".gif"];
    const ext     = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Type non autorisé — PDF, Word ou Image uniquement"));
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
  } catch { return null; }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "STUDENT") return res.status(403).json({ error: "Accès refusé" });

  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    await runMiddleware(req, res, upload.single("fichier"));

    const { devoirId } = req.body;
    if (!devoirId || !req.file) return res.status(400).json({ error: "devoirId et fichier obligatoires" });

    // Vérifier deadline
    const devoir = await prisma.devoir.findUnique({
      where:   { id: parseInt(devoirId) },
      include: {
        chapter: {
          include: {
            course: {
              include: {
                teachers: { select: { id: true, nom: true, prenom: true } },
              },
            },
          },
        },
      },
    });

    if (!devoir) return res.status(404).json({ error: "Devoir introuvable" });

    const now      = new Date();
    const deadline = new Date(devoir.dateLimit);
    deadline.setHours(0, 0, 0, 0);

    if (now > deadline) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "Date limite dépassée — dépôt impossible" });
    }

    const fichierUrl  = `/uploads/devoirs/${req.file.filename}`;
    const fichierNom  = req.file.originalname;
    const ext         = path.extname(fichierNom).toLowerCase();
    const fichierType = ext === ".pdf" ? "PDF" : [".doc", ".docx"].includes(ext) ? "WORD" : "IMAGE";

    // Upsert rendu
    const rendu = await prisma.devoirRendu.upsert({
      where:  { devoirId_studentId: { devoirId: parseInt(devoirId), studentId: user.id } },
      update: { fichierUrl, fichierNom, fichierType },
      create: { devoirId: parseInt(devoirId), studentId: user.id, fichierUrl, fichierNom, fichierType },
      include: { student: { select: { nom: true, prenom: true } } },
    });

    // ✅ Envoyer notification au teacher du cours
    const course   = devoir.chapter?.course;
    const teachers = course?.teachers || [];

    if (teachers.length > 0) {
      await prisma.notification.createMany({
        data: teachers.map(t => ({
          userId:  t.id,
          type:    "NOUVEAU_RENDU",
          contenu: `📋 ${rendu.student.prenom} ${rendu.student.nom} a déposé un rendu pour "${devoir.titre}"`,
        })),
      });

      // ✅ Étape 3 : Alerte pour le formateur "Soumission en attente"
      const teachersWithEmail = await prisma.user.findMany({
        where: { id: { in: teachers.map(t => t.id) } },
        select: { email: true, prenom: true }
      });

      for (const t of teachersWithEmail) {
        await sendEmail({
          to: t.email,
          subject: `Nouvelle soumission : ${devoir.titre}`,
          html: `
            <h1>Soumission en attente</h1>
            <p>Bonjour ${t.prenom},</p>
            <p>L'élève <strong>${rendu.student.prenom} ${rendu.student.nom}</strong> a déposé son devoir pour <strong>"${devoir.titre}"</strong>.</p>
            <p>Vous pouvez le corriger dès maintenant dans votre espace enseignant.</p>
          `,
        });
      }
    }

    return res.status(200).json(rendu);

  } catch (error) {
    console.error("UPLOAD DEVOIR ERROR:", error);
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}