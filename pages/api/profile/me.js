import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Récupérer le token JWT au lieu de la session
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(token.id) },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        photo: true,
        adresse: true,
        codePostal: true,
        ville: true,
        pays: true,
        telephone: true,
        dateNaissance: true,
        lieuNaissance: true,
        ecole: true,
        niveauScolaire: true,
        pourcentageCompletion: true,
        statutProfil: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      user,
      pourcentageCompletion: user.pourcentageCompletion || 0,
    });
  } catch (error) {
    console.error("Erreur GET /api/profile/me:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}