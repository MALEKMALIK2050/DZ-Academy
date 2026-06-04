import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Non autorisé" });
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userId = parseInt(user.id);

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Champs requis" });

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    const match = await bcrypt.compare(currentPassword, dbUser.password);
    if (!match) return res.status(400).json({ error: "Mot de passe actuel incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return res.status(200).json({ message: "Mot de passe mis à jour" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
