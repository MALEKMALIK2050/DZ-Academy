// pages/api/forum/[forumId]/posts/[postId].js
import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

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

  const postId = parseInt(req.query.postId)

  const existing = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  })

  if (!existing) return res.status(404).json({ error: "Post introuvable" })

  const isOwner   = existing.authorId === user.id
  const isTeacher = ["TEACHER", "ADMIN"].includes(user.role)

  // PATCH — modifier un post
  if (req.method === "PATCH") {
    if (!isOwner && !isTeacher) {
      return res.status(403).json({ error: "Action non autorisée" })
    }
    try {
      const { content, isFeedback, isApproved } = req.body

      const post = await prisma.forumPost.update({
        where: { id: postId },
        data: {
          ...(content    !== undefined && isOwner   && { content: content.trim() }),
          ...(isFeedback !== undefined && isTeacher && { isFeedback }),
          ...(isApproved !== undefined && isTeacher && { isApproved }),
        },
        include: {
          author: { select: authorSelect },
          _count: { select: { likes: true, children: true } },
        },
      })
      return res.status(200).json({ post })
    } catch (err) {
      console.error("[PATCH /api/forum/[forumId]/posts/[postId]]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  // DELETE — supprimer un post
  if (req.method === "DELETE") {
    if (!isOwner && !isTeacher) {
      return res.status(403).json({ error: "Action non autorisée" })
    }
    try {
      await prisma.forumPost.delete({ where: { id: postId } })
      return res.status(200).json({ success: true })
    } catch (err) {
      console.error("[DELETE /api/forum/[forumId]/posts/[postId]]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" })
}