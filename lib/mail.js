import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an email
 * @param {Object} options - { to, subject, text, html, attachments }
 */
export async function sendEmail({ to, subject, text, html, attachments = [] }) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_contact || 'cb-academy'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw if we want the application to continue even if email fails
    return null;
  }
}
