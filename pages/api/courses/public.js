// ======================================================
// FICHIER : pages/api/courses/public.js
// MODIFICATION : Ajout des enrollments pour l'utilisateur connecté
// ======================================================

import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken"; // ✅ AJOUT

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { niveau, matiere, annee } = req.query;

    // ✅ 1. Récupérer l'utilisateur connecté
    let userId = null;
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Token invalide, on ignore
      }
    }

    // ✅ 2. Construire les filtres
    const where = { status: "PUBLISHED" };
    if (niveau)  where.niveau  = { equals: niveau,  mode: "insensitive" };
    if (matiere) where.matiere = { equals: matiere, mode: "insensitive" };
    if (annee)   where.annee   = { equals: annee,   mode: "insensitive" };

    // ✅ 3. Récupérer les cours avec les inscriptions de l'utilisateur
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
        teacher: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        chapters: {
          select: { id: true },
        },
        // ✅ AJOUT : Inscriptions de l'utilisateur
        enrollments: userId ? {
          where: { userId: userId },
          select: {
            id: true,
            statut: true,
            typePaiement: true,
            progression: true,
            completed: true,
          },
        } : false,
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ 4. Transformer les données
    const formattedCourses = courses.map(course => ({
      ...course,
      enrollments: course.enrollments || [],
      chapters: course.chapters || [],
    }));

    return res.status(200).json(formattedCourses);
  } catch (error) {
    console.error("API COURS PUBLIC ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}