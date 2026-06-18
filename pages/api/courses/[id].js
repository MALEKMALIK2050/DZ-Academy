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

  // ====================================================
  // ✅ VALIDATION DE L'ID (CORRECTION DU BUG)
  // ====================================================
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "ID du cours manquant" });
  }

  const courseId = parseInt(id);

  if (isNaN(courseId)) {
    return res.status(400).json({ error: "ID du cours invalide" });
  }

  try {
    // ====================================================
    // GET — détail cours
    // ====================================================
    if (req.method === "GET") {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          designer: { select: { id: true, nom: true, prenom: true } },
          teachers: { select: { id: true, nom: true, prenom: true } },
          pretest: { include: { questions: true } },
          chapters: {
            orderBy: { ordre: "asc" },
            include: {
              supports: { orderBy: { ordre: "asc" }, include: { forum: true } },
              quiz:     { include: { questions: true } },
              devoirs:  {
                include: {
                  rendus: {
                    include: {
                      student: { select: { id: true, nom: true, prenom: true } },
                    },
                  },
                },
              },
            },
          },
          quizFinal:   { include: { questions: true } },
          enrollments: { select: { id: true } },
          scormPackages: { orderBy: { createdAt: 'desc' } }, // ✅ Support SCORM
        },
      });

      if (!course) return res.status(404).json({ error: "Cours introuvable" });
      return res.status(200).json(course);
    }

    // ====================================================
    // PUT — modifier infos cours ou statut
    // ====================================================
    if (req.method === "PUT") {
      if (user.role !== "DESIGNER" && user.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès refusé" });
      }

      const { title, description, objectifs, matiere, niveau, annee, status } = req.body;

      const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
          ...(title       && { title }),
          ...(description !== undefined && { description }),
          ...(objectifs   !== undefined && { objectifs }),
          ...(matiere     && { matiere }),
          ...(niveau      && { niveau }),
          ...(annee       && { annee }),
          ...(status      && { status }),
        },
      });

      if (status === "PUBLISHED") {
        const students = await prisma.user.findMany({
          where: { role: "STUDENT", niveau: updated.niveau },
          select: { email: true, prenom: true }
        });

        for (const student of students) {
          await sendEmail({
            to: student.email,
            subject: `Nouveau cours disponible : ${updated.title}`,
            html: `
              <h1>Nouveau cours disponible !</h1>
              <p>Bonjour ${student.prenom},</p>
              <p>Le cours <strong>"${updated.title}"</strong> est désormais accessible dans votre espace élève.</p>
              <p>Matière : ${updated.matiere || "N/A"}</p>
              <p>Connectez-vous pour commencer à apprendre.</p>
            `,
          });
        }
      }

      return res.status(200).json(updated);
    }

    // ====================================================
    // DELETE — supprimer cours
    // ====================================================
    if (req.method === "DELETE") {
      if (user.role !== "DESIGNER" && user.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès refusé" });
      }

      try {
        await prisma.quizResult.deleteMany({
          where: {
            quiz: {
              OR: [
                { chapter: { courseId: courseId } },
                { courseId: courseId }
              ]
            }
          }
        });

        await prisma.quiz.deleteMany({
          where: {
            OR: [
              { chapter: { courseId: courseId } },
              { courseId: courseId }
            ]
          }
        });

        await prisma.pretestResult.deleteMany({
          where: { courseId: courseId }
        });

        await prisma.chapter.deleteMany({
          where: { courseId: courseId }
        });

        await prisma.pretest.deleteMany({
          where: { courseId: courseId }
        });

        await prisma.enrollment.deleteMany({
          where: { courseId: courseId }
        });

        // ✅ Suppression des SCORM
        await prisma.scormPackage.deleteMany({
          where: { courseId: courseId }
        });

        await prisma.course.delete({
          where: { id: courseId }
        });

        return res.status(200).json({ message: "Cours supprimé" });
      } catch (err) {
        console.error('Erreur DELETE:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API COURSE [id] ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}