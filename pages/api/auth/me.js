import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  const token = req.cookies?.token;
  if (!token) return res.status(200).json({ user: null });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = await prisma.user.findUnique({
      where: { id: parseInt(decoded.id) },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        prenom: true,
        photo: true,
        telephone: true,
        // Adresse
        adresse: true,
        codePostal: true,
        ville: true,
        pays: true,
        // Personnel
        dateNaissance: true,
        lieuNaissance: true,
        village: true,
        // Scolarité (student)
        ecole: true,
        niveauScolaire: true,
        niveau: true,
        annee: true,
        // Professionnel (teacher/designer)
        specialite: true,
        biographie: true,
        diplome: true,
        universite: true,
        // Statut profil
        profilComplet: true,
        pourcentageCompletion: true,
        statutProfil: true,
      }
    });

    if (!dbUser) return res.status(200).json({ user: null });

    return res.status(200).json({ user: dbUser });
  } catch (error) {
    console.error("Erreur dans auth/me:", error);
    return res.status(200).json({ user: null });
  }
}