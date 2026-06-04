// pages/api/forum/[forumId]/posts/[postId]/like.js
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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" })
  }

  const postId = parseInt(req.query.postId)
  const userId = user.id

  try {
    const existing = await prisma.forumPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    })

    if (existing) {
      await prisma.forumPostLike.delete({
        where: { postId_userId: { postId, userId } },
      })
    } else {
      await prisma.forumPostLike.create({
        data: { postId, userId },
      })
    }

    const count = await prisma.forumPostLike.count({
      where: { postId },
    })

    return res.status(200).json({ liked: !existing, count })
  } catch (err) {
    console.error("[POST /api/forum/[forumId]/posts/[postId]/like]", err)
    return res.status(500).json({ error: "Erreur serveur" })
  }
}