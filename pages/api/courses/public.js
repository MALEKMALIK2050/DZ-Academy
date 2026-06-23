// pages/api/courses/public.js
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    // ✅ Récupérer TOUS les cours
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        matiere: true,
        niveau: true,
        annee: true,
        coverImage: true,
        chapters: { select: { id: true } },
        teacher: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("📚 Cours trouvés:", courses.length);
    return res.status(200).json(courses);
  } catch (error) {
    console.error("API COURS PUBLIC ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}