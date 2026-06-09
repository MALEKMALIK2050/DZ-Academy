import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envoie un email via Resend
 * @param {Object} options - { to, subject, html, text }
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const data = await resend.emails.send({
      from: "CBA Academy <contact@cb-academy.dz>",
      to,
      subject,
      html,
      text,
    });
    console.log("✅ Email envoyé:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    return null;
  }
}