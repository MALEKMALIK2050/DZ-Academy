import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Non autorisé' });

  const { courseId } = req.query;
  if (!courseId) return res.status(400).json({ error: 'courseId requis' });

  try {
    const packages = await prisma.scormPackage.findMany({
      where: { courseId: parseInt(courseId) },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(packages);
  } catch (error) {
    console.error('Erreur liste SCORM:', error);
    return res.status(500).json({ error: error.message });
  }
}