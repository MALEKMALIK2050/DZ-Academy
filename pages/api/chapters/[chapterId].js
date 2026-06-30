import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });

  const { chapterId } = req.query;

if (req.method === "GET") {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) },
      include: {
        supports: { orderBy: { ordre: "asc" } },
        quiz: { include: { questions: true } },
        devoirs: { // ✅ ajouté
          include: {
            rendus: {
              include: {
                student: {
                  select: { id: true, nom: true, prenom: true }
                }
              }
            }
          }
        }
      }
    });

      if (!chapter) return res.status(404).json({ error: "Chapitre introuvable" });
      return res.status(200).json(chapter);

    } catch (error) {
      console.error("API CHAPTER [id] ERROR:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}