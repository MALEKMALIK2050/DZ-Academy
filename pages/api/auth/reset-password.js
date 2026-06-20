import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Not allowed" });

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token et mot de passe sont requis" });
    }

    // Chercher l'utilisateur avec ce token et vérifier si le token n'a pas expiré
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Le token ne doit pas être expiré
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Le lien de réinitialisation est invalide ou a expiré" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.status(200).json({ success: true, message: "Mot de passe réinitialisé avec succès!" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}