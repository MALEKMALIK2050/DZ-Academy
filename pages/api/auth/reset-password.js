import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Not allowed" });

  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ success: true, message: "Mot de passe réinitialisé!" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}