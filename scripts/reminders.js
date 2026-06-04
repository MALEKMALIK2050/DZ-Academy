// scripts/reminders.js
// Script à exécuter via Cron (ex: chaque matin à 8h)
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../lib/mail.js';

const prisma = new PrismaClient();

async function runReminders() {
  console.log("🚀 Début de l'envoi des rappels...");
  
  const now = new Date();
  const j2 = new Date(); j2.setDate(now.getDate() + 2);
  const j10 = new Date(); j10.setDate(now.getDate() + 10);

  // Trouver les devoirs dont la date limite est dans 2 jours ou 10 jours
  const upcomingDevoirs = await prisma.devoir.findMany({
    where: {
      OR: [
        { dateLimit: { gte: now, lte: j2 } },
        { dateLimit: { gte: now, lte: j10 } }
      ]
    },
    include: {
      chapter: {
        include: {
          course: {
            include: {
              enrollments: {
                where: { completed: false },
                include: { student: true }
              }
            }
          }
        }
      }
    }
  });

  for (const devoir of upcomingDevoirs) {
    const daysLeft = Math.ceil((new Date(devoir.dateLimit) - now) / (1000 * 60 * 60 * 24));
    
    for (const enrollment of devoir.chapter.course.enrollments) {
      const student = enrollment.student;
      
      // Vérifier si l'élève a déjà rendu le devoir
      const rendu = await prisma.devoirRendu.findUnique({
        where: { devoirId_studentId: { devoirId: devoir.id, studentId: student.id } }
      });

      if (!rendu) {
        await sendEmail({
          to: student.email,
          subject: `Rappel : Devoir "${devoir.titre}" à rendre dans ${daysLeft} jours`,
          html: `
            <h1>N'oubliez pas votre devoir !</h1>
            <p>Bonjour ${student.prenom},</p>
            <p>La date limite pour rendre le devoir <strong>"${devoir.titre}"</strong> approche.</p>
            <p>Il vous reste environ <strong>${daysLeft} jours</strong> pour soumettre votre travail.</p>
            <p>Connectez-vous sur la plateforme pour accéder au cours et déposer votre fichier.</p>
          `,
        });
      }
    }
  }

  console.log("✅ Rappels envoyés.");
}

runReminders()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
