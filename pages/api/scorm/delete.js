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
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUser(req);
  if (!user || user.role !== 'DESIGNER') return res.status(401).json({ error: 'Non autorisé' });

  const { scormId } = req.body;
  if (!scormId) return res.status(400).json({ error: 'scormId requis' });

  try {
    await prisma.scormPackage.delete({ where: { id: parseInt(scormId) } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur suppression SCORM:', error);
    return res.status(500).json({ error: error.message });
  }
}