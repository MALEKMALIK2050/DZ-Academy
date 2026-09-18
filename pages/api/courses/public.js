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

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  try {
    const { niveau, annee, matiere, search } = req.query;

    const user = getUser(req);
    const where = { status: "PUBLISHED" };

    if (niveau && niveau.trim()) {
      const n = niveau.trim();
      if (n === "college" || n === "المتوسط" || n === "التعليم المتوسط") {
        where.niveau = { in: ["college", "المتوسط", "التعليم المتوسط"] };
      } else if (n === "lycee" || n === "الثانوي" || n === "التعليم الثانوي") {
        where.niveau = { in: ["lycee", "الثانوي", "التعليم الثانوي"] };
      } else {
        where.niveau = n;
      }
    }

    if (annee && annee.trim()) {
      where.annee = annee.trim();
    }

    if (matiere && matiere.trim()) {
      where.matiere = matiere.trim();
    }

    if (search && search.trim()) {
      const keywords = search.trim().split(/\s+/).filter(Boolean);
      if (keywords.length > 0) {
        where.AND = [
          ...(where.AND || []),
          ...keywords.map((kw) => ({
            title: { contains: kw, mode: "insensitive" },
          })),
        ];
      }
    }

    const selectFields = {
      id: true,
      title: true,
      description: true,
      matiere: true,
      niveau: true,
      annee: true,
      coverImage: true,
      prix: true,
      chapters: { select: { id: true } },
      teachers: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
    };

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

    const coursesRaw = await prisma.course.findMany({
      where,
      select: selectFields,
      orderBy: { createdAt: "asc" },
    });

    const seenFirst = new Set();
    const parcoursPrices = {};
    for (const c of coursesRaw) {
      const key = `${c.matiere}-${c.niveau}-${c.annee}`;
      if (!parcoursPrices[key]) parcoursPrices[key] = 0;
      parcoursPrices[key] += c.prix || 0;
    }

    const courses = coursesRaw.map((course) => {
      const key = `${course.matiere}-${course.niveau}-${course.annee}`;
      let isFreeTrial = false;

      if (!seenFirst.has(key)) {
        seenFirst.add(key);
        isFreeTrial = true;
      }

      return {
        ...course,
        teacher: course.teachers?.[0] || null,
        isFreeTrial,
        parcoursTotalPrice: parcoursPrices[key]
      };
    });

    courses.reverse();

    return res.status(200).json(courses);
  } catch (error) {
    console.error("API COURS PUBLIC ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
