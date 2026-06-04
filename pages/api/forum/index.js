// pages/api/forum/index.js
import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

function getUser(req) {
  try {
    const token = req.cookies?.token
    if (!token) return null
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch { return null }
}

export default async function handler(req, res) {
  const user = getUser(req)
  if (!user) return res.status(401).json({ error: "Non autorisé" })

  // GET — liste les forums d'un cours ou chapitre
  if (req.method === "GET") {
    try {
      const { courseId, chapitreId } = req.query

      const courseIdInt = courseId ? parseInt(courseId) : null
      const chapitreIdInt = chapitreId ? parseInt(chapitreId) : null

      const forums = await prisma.forum.findMany({
        where: {
          ...(courseIdInt && !isNaN(courseIdInt) ? { courseId: courseIdInt } : {}),
          ...(chapitreIdInt && !isNaN(chapitreIdInt) ? { chapitreId: chapitreIdInt } : {}),
        },
        include: {
          createdBy: { select: { id: true, nom: true, prenom: true, role: true } },
          chapter: { select: { id: true, title: true } },
          _count: { select: { posts: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      return res.status(200).json({ forums })
    } catch (err) {
      console.error("[GET /api/forum]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  // POST — créer un forum (TEACHER, DESIGNER, ADMIN)
  if (req.method === "POST") {
    if (!["TEACHER", "DESIGNER", "ADMIN"].includes(user.role)) {
      return res.status(403).json({ error: "Accès refusé" })
    }
    try {
      const {
        title, description, type, chapitreId, courseId,
        position, isModerated, isRequired, allowAnonymous,
        isPeerReview, notifyTeacher, openAt, closeAt,
      } = req.body

      if (!title || !chapitreId) {
        return res.status(400).json({ error: "Titre et chapitre obligatoires" })
      }

      const chapitreIdInt = parseInt(chapitreId)
      if (isNaN(chapitreIdInt)) {
        return res.status(400).json({ error: "chapitreId invalide" })
      }

      const courseIdInt = courseId ? parseInt(courseId) : null
      if (courseId && isNaN(courseIdInt)) {
        return res.status(400).json({ error: "courseId invalide" })
      }

      const forum = await prisma.forum.create({
        data: {
          title,
          description: description ?? null,
          type: type ?? "OPEN",
          position: position ?? "END",
          status: "DRAFT",
          chapitreId: chapitreIdInt,
          courseId: courseIdInt,
          createdById: parseInt(user.id),   // JWT renvoie un string, Prisma attend un Int
          isModerated: isModerated ?? false,
          isRequired: isRequired ?? false,
          allowAnonymous: allowAnonymous ?? false,
          isPeerReview: isPeerReview ?? false,
          notifyTeacher: notifyTeacher ?? true,
          openAt: openAt ? new Date(openAt) : null,
          closeAt: closeAt ? new Date(closeAt) : null,
        },
      })
      return res.status(201).json({ forum })
    } catch (err) {
      console.error("[POST /api/forum]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" })
}
