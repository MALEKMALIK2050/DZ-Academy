import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/users/change-password?userId=X
 * Changer le mot de passe de l'utilisateur
 * Body: { oldPassword, newPassword, newPasswordConfirm }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId requis' });

  const { oldPassword, newPassword, newPasswordConfirm } = req.body;

  if (!oldPassword || !newPassword || !newPasswordConfirm) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  if (newPassword !== newPasswordConfirm) {
    return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    console.log('🔐 Changement de mot de passe pour:', userId);

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword },
    });

    console.log('✅ Mot de passe changé avec succès');

    return res.status(200).json({
      success: true,
      message: '✅ Mot de passe changé avec succès',
    });

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    return res.status(500).json({ error: `Erreur: ${error.message}` });
  }
}