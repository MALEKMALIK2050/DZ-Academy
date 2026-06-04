import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail(to, subject, html) {
  try {
    const data = await resend.emails.send({
      from: 'contact@cb-academy.dz', // adresse liée à ton domaine validé
      to,
      subject,
      html,
    });
    console.log('Email envoyé:', data);
    return data;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    throw error;
  }
}
