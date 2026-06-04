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
  if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });

  if (req.method === "GET") {
    try {
      const courses = await prisma.course.findMany({
        include: {
          chapters: {
            orderBy: { ordre: "asc" },
            include: {
              supports: { orderBy: { ordre: "asc" } },
              quiz:     { include: { questions: true } },
            },
          },
          enrollments: { select: { id: true, statut: true } },
          quizFinal:   { include: { questions: true } },
          teachers:    { select: { id: true, nom: true, prenom: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(courses);
    } catch (error) {
      console.error("API DESIGNER COURSES ERROR:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}


