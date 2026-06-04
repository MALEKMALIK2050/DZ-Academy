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
  const user = getUser(req);
  if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

  if (req.method === "GET") {
    try {
      const courses = await prisma.course.findMany({
        include: {
          teachers: { select: { id: true, nom: true, prenom: true, role: true } },
          designer: { select: { id: true, nom: true, prenom: true } }
        }
      });
      return res.status(200).json(courses);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "PATCH") {
    const { courseId, teacherIds } = req.body; // Expect array of teacher IDs
    if (!courseId) return res.status(400).json({ error: "courseId manquant" });

    try {
      await prisma.course.update({
        where: { id: parseInt(courseId) },
        data: {
          teachers: {
            set: (teacherIds || []).map(id => ({ id: parseInt(id) }))
          }
        },
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}