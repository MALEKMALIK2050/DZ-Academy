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

  const { id } = req.query;
  const courseId = parseInt(id);

  try {
    // GET — détail cours
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
        },
      });

      if (!course) return res.status(404).json({ error: "Cours introuvable" });
      return res.status(200).json(course);
    }

    // PUT — modifier infos cours ou statut
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

      // ✅ Étape 2 : Notification Nouveau Contenu (si publié)
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

    // DELETE — supprimer cours

    // DELETE — supprimer cours
if (req.method === "DELETE") {
  if (user.role !== "DESIGNER" && user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé" });
  }

  try {
    // 1. Supprimer les QuizResult
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

    // 2. Supprimer les Quiz
    await prisma.quiz.deleteMany({
      where: {
        OR: [
          { chapter: { courseId: courseId } },
          { courseId: courseId }
        ]
      }
    });

    // 3. Supprimer les PretestResult (par courseId)
    await prisma.pretestResult.deleteMany({
      where: { courseId: courseId }
    });

    // 4. Supprimer les Chapters
    await prisma.chapter.deleteMany({
      where: { courseId: courseId }
    });

    // 5. Supprimer Pretest
    await prisma.pretest.deleteMany({
      where: { courseId: courseId }
    });

    // 6. Supprimer Enrollments
    await prisma.enrollment.deleteMany({
      where: { courseId: courseId }
    });

    // 7. Supprimer le Course
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