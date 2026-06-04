

import dotenv from 'dotenv';
dotenv.config();

import { sendEmail } from './lib/mail.js';

async function main() {
  try {
    await sendEmail({
      to: 'mmouce113@gmail.com',
      subject: 'Test GMAIL SMTP',
      html: '<p>Ceci est un test depuis mon LMS avec GMAIL SMTP.</p>',
    });
  } catch (error) {
    console.error('Erreur testMail:', error);
  }
}

main();

