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
  if (user.role !== "TEACHER") return res.status(403).json({ error: "Accès refusé" })

  const { forumId, postId } = req.query
  const { grade, feedback } = req.body

  if (req.method === "PATCH") {
    try {
      const post = await prisma.forumPost.update({
        where: { id: parseInt(postId) },
        data: {
          grade: parseInt(grade) || 0,
          feedback: feedback || null,
          gradedAt: new Date(),
          gradedById: user.id
        },
        include: {
          author: { select: { id: true, nom: true, prenom: true, role: true } },
          gradedBy: { select: { id: true, nom: true, prenom: true } }
        }
      })
      return res.status(200).json(post)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" })
}