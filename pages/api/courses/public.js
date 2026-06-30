// pages/api/courses/public.js
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
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { niveau, annee, matiere } = req.query;

    // ✅ Construire les filtres dynamiquement
    const where = {};
    if (niveau) where.niveau = niveau;
    if (annee) where.annee = annee;
    if (matiere) where.matiere = matiere;

    // ✅ Récupérer l'utilisateur connecté (optionnel, pour afficher le statut d'inscription)
    const user = getUser(req);

    // ✅ Construire le select dynamiquement selon si l'utilisateur est connecté
    const selectFields = {
      id: true,
      title: true,
      description: true,
      matiere: true,
      niveau: true,
      annee: true,
      coverImage: true,
      chapters: { select: { id: true } },
      teachers: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
    };

    // ✅ Ajouter les inscriptions seulement si l'étudiant est connecté
    if (user) {
      selectFields.enrollments = {
        where: { studentId: user.id },
        select: {
          id: true,
          statut: true,
          typePaiement: true,
        },
      };
    }

    const courses = await prisma.course.findMany({
      where,
      select: selectFields,
      orderBy: { createdAt: "desc" },
    });

    console.log(
      `📚 Cours trouvés: ${courses.length} (filtres: niveau=${niveau || "tous"}, annee=${annee || "toutes"}, matiere=${matiere || "toutes"})`
    );
    return res.status(200).json(courses);
  } catch (error) {
    console.error("API COURS PUBLIC ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}