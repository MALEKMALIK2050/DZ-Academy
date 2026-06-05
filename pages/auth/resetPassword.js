import crypto from 'crypto';
import { sendMail } from '../../services/sendMail.js'; // adapte le chemin

// Génère un token sécurisé
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 caractères hexadécimaux
}

// Fonction pour envoyer le mail de reset
export async function resetPassword(email) {
  try {
    // 1. Générer un token unique
    const token = generateResetToken();

    // 2. Construire le lien de reset (local pour l’instant)
    const resetLink = `http://localhost:3000/auth/reset?token=${token}`;

    // 3. Envoyer le mail
    await sendMail(
      email,
      'Réinitialisation de votre mot de passe',
      `<p>Vous avez demandé à réinitialiser votre mot de passe.</p>
       <p>Cliquez sur ce lien pour continuer : <a href="${resetLink}">${resetLink}</a></p>`
    );

    console.log('Mail de réinitialisation envoyé avec succès');
    return token; // tu peux stocker ce token en BDD pour vérifier plus tard
  } catch (error) {
    console.error('Erreur lors de l’envoi du mail de réinitialisation:', error);
  }
}
export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div>
        <h1>Réinitialisation du mot de passe</h1>
        <p>Cette fonctionnalité sera bientôt disponible.</p>
        <a href="/auth/login">← Retour à la connexion</a>
      </div>
    </div>
  );
}