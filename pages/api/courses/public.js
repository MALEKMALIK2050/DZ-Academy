// pages/api/courses/public.js
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { niveau, matiere, annee } = req.query;

    const where = { status: "PUBLISHED" };
    if (niveau)  where.niveau  = { equals: niveau,  mode: "insensitive" };
    if (matiere) where.matiere = { equals: matiere, mode: "insensitive" };
    if (annee)   where.annee   = { equals: annee,   mode: "insensitive" };

    const courses = await prisma.course.findMany({
      where,
      select: {
        id:          true,
        title:       true,
        description: true,
        matiere:     true,
        niveau:      true,
        annee:       true,
        coverImage:  true,
        chapters:    { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
