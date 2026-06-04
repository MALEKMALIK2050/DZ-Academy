import { PrismaClient } from "@prisma/client";
import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId requis" });

  try {
    console.log("📸 Upload FormData:", userId);
    
    const uploadDir = path.join(process.cwd(), "public/uploads/profiles");
    await fs.mkdir(uploadDir, { recursive: true });

    const form = formidable({ uploadDir, keepExtensions: true });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const uploadedFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;
    if (!uploadedFile) return res.status(400).json({ error: "Pas de fichier" });

    const fileName = `${userId}-${Date.now()}.jpg`;
    const newPath = path.join(uploadDir, fileName);
    await fs.rename(uploadedFile.filepath, newPath);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { photo: `/uploads/profiles/${fileName}` },
    });

    console.log("✅ Photo uploadée");
    return res.status(200).json({ success: true, photo: `/uploads/profiles/${fileName}` });
  } catch (error) {
    console.error("❌ Erreur:", error);
    return res.status(500).json({ error: error.message });
  }
}
