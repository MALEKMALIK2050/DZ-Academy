import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/mail";

function getUser(req) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "STUDENT") return res.status(403).json({ error: "Accès refusé" });

  const studentId = parseInt(user.id);

  try {
    if (req.method === "GET") {
      const { niveau, annee, matiere } = req.query;

      const where = { status: "PUBLISHED" };

      if (niveau) {
        const nNorm = niveau.trim().toLowerCase();
        if (nNorm === "college" || nNorm.includes("متوسط")) {
          where.niveau = { in: ["college", "المتوسط", "متوسط", "التعليم المتوسط"] };
        } else if (nNorm === "lycee" || nNorm.includes("ثانوي")) {
          where.niveau = { in: ["lycee", "الثانوي", "ثانوي", "التعليم الثانوي"] };
        } else {
          where.niveau = { equals: niveau, mode: "insensitive" };
        }
      }

      if (annee) {
        const aNorm = annee.trim().toLowerCase();
        const MAPPING_ANNEES = [
          ["1am", "السنة الأولى متوسط", "6eme", "السنة 1 متوسط"],
          ["2am", "السنة الثانية متوسط", "5eme", "السنة 2 متوسط"],
          ["3am", "السنة الثالثة متوسط", "4eme", "السنة 3 متوسط"],
          ["4am", "السنة الرابعة متوسط", "3eme", "السنة 4 متوسط"],
          ["1as", "السنة الأولى ثانوي", "السنة 1 ثانوي"],
          ["2as", "السنة الثانية ثانوي", "السنة 2 ثانوي"],
          ["3as", "السنة الثالثة ثانوي", "terminale", "السنة الثالثة ثانوي (بكالوريا)", "السنة 3 ثانوي"]
        ];

        const matchGroup = MAPPING_ANNEES.find(group => group.some(item => item.toLowerCase() === aNorm));
        if (matchGroup) {
          where.annee = { in: matchGroup };
        } else {
          where.annee = { equals: annee, mode: "insensitive" };
        }
      }

      if (matiere) {
        const mNorm = matiere.trim().toLowerCase();
        const MAPPING_MATIERES = [
          ["math", "الرياضيات", "رياضيات"],
          ["physique", "الفيزياء والكيمياء", "الفيزياء", "فيزياء"],
          ["svt", "علوم الحياة والأرض", "علوم الطبيعة والحياة", "العلوم"],
          ["informatique", "الإعلام الآلي", "إعلام آلي"],
          ["histoire", "التاريخ والجغرافيا", "تاريخ وجغرافيا"],
          ["francais", "اللغة الفرنسية", "فرنسية"],
          ["anglais", "اللغة الإنجليزية", "إنجليزية"],
          ["arabe", "اللغة العربية", "عربية"],
          ["philosophie", "الفلسفة", "فلسفة"],
          ["education_islamique", "التربية الإسلامية", "إسلامية"],
          ["allemand", "اللغة الألمانية", "ألمانية"],
          ["italien", "اللغة الإيطالية", "إيطالية"]
        ];

        const matchGroup = MAPPING_MATIERES.find(group => group.some(item => item.toLowerCase() === mNorm));
        if (matchGroup) {
          where.matiere = { in: matchGroup };
        } else {
          where.matiere = { equals: matiere, mode: "insensitive" };
        }
      }

      const [catalogue, enrollments] = await Promise.all([
        prisma.course.findMany({
          where,
          include: {
            designer:    { select: { nom: true, prenom: true } },
            teachers:    { select: { id: true, nom: true, prenom: true } },
            chapters:    { select: { id: true } },
            enrollments: {
              where:  { studentId },
              select: { id: true, progression: true, completed: true, statut: true, typePaiement: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.enrollment.findMany({
          where: { studentId },
          include: {
            course: {
              include: {
                chapters: { 
                  select: { 
                    id: true,
                    progress: { where: { studentId } },
                    quiz: {
                      select: {
                        id: true,
                        quizResults: { where: { studentId } }
                      }
                    }
                  } 
                },
                teachers: { select: { id: true, nom: true, prenom: true } },
                pretestResults: { where: { studentId } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return res.status(200).json({ catalogue, enrollments });
    }

    if (req.method === "POST") {
      const { courseId, typePaiement } = req.body;
      if (!courseId) return res.status(400).json({ error: "courseId manquant" });

      const courseIdInt = parseInt(courseId);

      const course = await prisma.course.findFirst({
        where: { id: courseIdInt, status: "PUBLISHED" },
      });
      if (!course) return res.status(404).json({ error: "Cours introuvable" });

      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId: courseIdInt } },
      });
      if (existing) return res.status(400).json({ error: "Demande déjà envoyée", statut: existing.statut });

      const enrollment = await prisma.enrollment.create({
        data: {
          studentId,
          courseId:     courseIdInt,
          statut:       "EN_ATTENTE",
          typePaiement: typePaiement || "COURS_SEUL",
        },
      });
      return res.status(201).json(enrollment);
    }

    if (req.method === "DELETE") {
      const { courseId } = req.body;
      if (!courseId) return res.status(400).json({ error: "courseId manquant" });

      const courseIdInt = parseInt(courseId);
      const course = await prisma.course.findUnique({ where: { id: courseIdInt } });

      await prisma.enrollment.deleteMany({
        where: {
          studentId,
          courseId: courseIdInt,
          statut:   "EN_ATTENTE",
        },
      });

      await sendEmail({
        to: user.email,
        subject: `Désinscription confirmée : ${course?.title || "Cours"}`,
        html: `
          <h1>Désinscription confirmée</h1>
          <p>Bonjour,</p>
          <p>Votre demande d'inscription au cours <strong>"${course?.title || "le cours"}"</strong> a été annulée ou supprimée.</p>
          <p>Vos accès à ce contenu sont désormais suspendus.</p>
        `,
      });

      return res.status(200).json({ message: "Demande annulée" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API STUDENT COURSES ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}