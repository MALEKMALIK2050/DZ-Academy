// pages/api/courses/public.js
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { niveau, annee, matiere } = req.query;

    // ✅ Construire les filtres dynamiquement avec correspondance souple et universelle
    const where = {};

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

    // ✅ Récupérer l'utilisateur connecté (optionnel, pour afficher le statut d'inscription)
    const user = getUser(req);

    // ✅ Construire le select dynamiquement selon si l'utilisateur est connecté
    const selectFields = {
      id: true,
      title: true,
      description: true,
      matiere: true,
      niveau: true,
      annee: true,
      coverImage: true,
      chapters: { select: { id: true } },
      teachers: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
    };

    // ✅ Ajouter les inscriptions seulement si l'étudiant est connecté
    if (user) {
      selectFields.enrollments = {
        where: { studentId: user.id },
        select: {
          id: true,
          statut: true,
          typePaiement: true,
        },
      };
    }

    const courses = await prisma.course.findMany({
      where,
      select: selectFields,
      orderBy: { createdAt: "desc" },
    });

    console.log(
      `📚 Cours trouvés: ${courses.length} (filtres: niveau=${niveau || "tous"}, annee=${annee || "toutes"}, matiere=${matiere || "toutes"})`
    );
    return res.status(200).json(courses);
  } catch (error) {
    console.error("API COURS PUBLIC ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}