import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/mail";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

  try {
    // GET — toutes les inscriptions
    if (req.method === "GET") {
      const { statut } = req.query;

      const enrollments = await prisma.enrollment.findMany({
        where: statut ? { statut } : {},
        include: {
          student: { select: { id: true, nom: true, prenom: true, email: true, classe: true, niveau: true } },
          course:  { select: { id: true, title: true, matiere: true, niveau: true, annee: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(enrollments);
    }

    // PATCH — valider ou rejeter
if (req.method === "PATCH") {
  const { enrollmentId, statut, prixPaye, note } = req.body;

  // Validation des statuts autorisés
  const statutsValides = ["PAYE", "GRATUIT", "REJETE"];
  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ error: "Statut invalide" });
  }

  // Mise à jour avec les bons noms de champs
  const updated = await prisma.enrollment.update({
    where: { id: parseInt(enrollmentId) },
    data: { 
      statut: statut,
      prixPaye: statut === "PAYE" ? prixPaye : null,
      valideAt: new Date(),      // ✅ bon nom (pas dateValidation)
      note: note || null,
      // validePar: user.id      // si tu veux loguer qui a validé
    }
  });

// EMAIL À L'ÉLÈVE APRÈS VALIDATION/REJET
if (statut === "PAYE" || statut === "GRATUIT" || statut === "REJETE") {
  try {
    const student = await prisma.user.findUnique({ 
      where: { id: updated.studentId },
      select: { email: true, prenom: true, nom: true }
    });
    const course = await prisma.course.findUnique({ 
      where: { id: updated.courseId },
      select: { title: true, id: true }
    });
    
    const isApproved = statut === "PAYE" || statut === "GRATUIT";
    
    await sendEmail({
      to: student.email,
      subject: `Inscription au cours "${course.title}" - ${isApproved ? "Validée ✅" : "Refusée ❌"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${isApproved ? '#059669' : '#dc2626'}; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">${isApproved ? "🎉 Félicitations !" : "❌ Demande refusée"}</h1>
          </div>
          <div style="padding: 20px; background: #f8fafc; border-radius: 0 0 12px 12px;">
            <p>Bonjour <strong>${student.prenom} ${student.nom}</strong>,</p>
            <p>Votre demande d'inscription au cours <strong>"${course.title}"</strong> a été <strong>${isApproved ? "validée" : "refusée"}</strong>.</p>
            ${note ? `<p><strong>📝 Note de l'administrateur :</strong> ${note}</p>` : ""}
            ${isApproved ? `
              <div style="margin: 20px 0; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard/student/courses/${course.id}" 
                   style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  📖 Accéder au cours
                </a>
              </div>
            ` : ""}
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">CBA Academy — Cheikh Bouamama Academy</p>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Erreur envoi email validation inscription:", emailError);
  }
}

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API ADMIN ENROLLMENTS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}