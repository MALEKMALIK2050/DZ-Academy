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
  if (!user) return res.status(401).json({ error: "Non autorisé" });

  if (req.method === "GET") {
    const courses = await prisma.course.findMany({
      where: { designerId: user.id },
      include: {
        chapters:    { select: { id: true } },
        enrollments: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(courses);
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}