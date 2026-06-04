import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res);

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { oldPassword, newPassword } = req.body;

    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Les deux mots de passe sont requis" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit faire au moins 8 caractères" });
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "L'ancien mot de passe est incorrect" });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      message: "Mot de passe changé avec succès. Veuillez vous reconnecter.",
    });
  } catch (error) {
    console.error("Erreur POST /api/profile/change-password:", error);
    return res.status(500).json({ error: "Erreur lors du changement de mot de passe" });
  }
}
