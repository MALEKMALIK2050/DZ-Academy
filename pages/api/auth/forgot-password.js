import prisma from "@/lib/prisma";
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'L\'email est requis' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Pour des raisons de sécurité, nous ne disons pas si l'utilisateur existe ou non.
      return res.status(200).json({ success: true, message: 'Email envoyé' });
    }

    // Générer un token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 3600000); // Expire dans 1 heure

    // Enregistrer le token dans la DB
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: tokenExpires,
      },
    });

    // Construire le lien de réinitialisation
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

    // Envoyer l'email
    const { error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME || 'CBA Academy'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${user.prenom},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:10px 20px;background-color:#3b82f6;color:white;text-decoration:none;border-radius:5px;">Réinitialiser mon mot de passe</a></p>
        <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
        <p>${resetLink}</p>
        <p>Ce lien est valide pendant 1 heure.</p>
        <p>Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet email.</p>
        <br/>
        <p>L'équipe CBA Academy</p>
      `,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
    }

    res.status(200).json({ success: true, message: 'Email envoyé' });
  } catch (error) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
}
