import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, text, html, attachments = [] }) {
  try {
    // Utilisation de Resend au lieu de nodemailer
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.RESEND_FROM_NAME || 'CBA Academy';
    
    console.log(`📧 Envoi d'email à ${to} via Resend...`);
    
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${from}>`,
      to: [to],
      subject,
      html: html || text,
    });

    if (error) {
      console.error("Resend error:", error);
      return null;
    }

    console.log(`✅ Email envoyé avec succès ! ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    return null;
  }
}

export default { sendEmail };