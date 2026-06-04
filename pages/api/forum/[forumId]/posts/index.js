import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { sendEmail } from "@/lib/mail"

function getUser(req) {
  try {
    const token = req.cookies?.token
    if (!token) return null
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch { return null }
}

const authorSelect = {
  id: true, nom: true, prenom: true, role: true,
}

export default async function handler(req, res) {
  const user = getUser(req)
  if (!user) return res.status(401).json({ error: "Non autorisé" })

  const forumId = parseInt(req.query.forumId)

  // GET — tous les posts
  if (req.method === "GET") {
    try {
      const posts = await prisma.forumPost.findMany({
        where: { forumId },
        include: {
          author: { select: authorSelect },
          likes:  { select: { userId: true } },
          _count: { select: { likes: true, children: true } },
        },
        orderBy: { createdAt: "asc" },
      })
      return res.status(200).json({ posts })
    } catch (err) {
      console.error("[GET /api/forum/[forumId]/posts]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  // POST — créer un post / réponse
  if (req.method === "POST") {
    try {
      const { content, parentId, isAnonymous } = req.body

      if (!content?.trim()) {
        return res.status(400).json({ error: "Le contenu est obligatoire" })
      }

      const forum = await prisma.forum.findUnique({
        where: { id: forumId },
        select: { status: true, closeAt: true, isModerated: true },
      })

      if (!forum) {
        return res.status(404).json({ error: "Forum introuvable" })
      }
      if (forum.status !== "PUBLISHED") {
        return res.status(403).json({ error: "Ce forum est fermé" })
      }
      if (forum.closeAt && new Date(forum.closeAt) < new Date()) {
        return res.status(403).json({ error: "Date limite dépassée" })
      }

      // Calcule la profondeur
      let depth = 0
      if (parentId) {
        const parent = await prisma.forumPost.findUnique({
          where: { id: parseInt(parentId) },
          select: { depth: true },
        })
        depth = (parent?.depth ?? 0) + 1
      }

      const post = await prisma.forumPost.create({
        data: {
          content:     content.trim(),
          forumId,
          authorId:    user.id,
          parentId:    parentId ? parseInt(parentId) : null,
          isAnonymous: isAnonymous ?? false,
          isApproved:  !forum.isModerated,
          isFeedback:  req.body.isFeedback === true && ["TEACHER", "ADMIN"].includes(user.role),
          depth,
        },
        include: {
          author: { select: authorSelect },
          likes:  { select: { userId: true } },
          _count: { select: { likes: true, children: true } },
          forum: { include: { course: { include: { enrollments: { include: { student: { select: { email: true, prenom: true, id: true } } } } } } } }
        },
      })

      // ✅ Étape 7 : Alerte pour les apprenants (Nouveau message forum)
      if (post.isApproved) {
        const enrolledStudents = post.forum.course?.enrollments.map(e => e.student) || [];
        
        for (const student of enrolledStudents) {
          // Ne pas s'envoyer un mail à soi-même
          if (student.id === user.id) continue;

          await sendEmail({
            to: student.email,
            subject: `Nouveau message dans le forum : ${post.forum.title}`,
            html: `
              <h1>Discussion sur le forum</h1>
              <p>Bonjour ${student.prenom},</p>
              <p>Un nouveau message a été posté dans le forum <strong>"${post.forum.title}"</strong>.</p>
              <p><em>"${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"</em></p>
              <p>Connectez-vous pour répondre ou participer à la discussion.</p>
            `,
          });
        }
      }

      return res.status(201).json({ post })
    } catch (err) {
      console.error("[POST /api/forum/[forumId]/posts]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" })
}