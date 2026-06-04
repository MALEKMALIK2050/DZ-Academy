// pages/api/forum/[forumId]/moderation.js
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

  if (!["TEACHER", "ADMIN"].includes(user.role)) {
    return res.status(403).json({ error: "Accès refusé" })
  }

  const forumId = parseInt(req.query.forumId)

  // GET — posts en attente + stats
  if (req.method === "GET") {
    try {
      const [pending, totalPosts, stats] = await Promise.all([
        prisma.forumPost.findMany({
          where: { forumId, isApproved: false },
          include: {
            author: { select: { id: true, nom: true, prenom: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.forumPost.count({ where: { forumId } }),
        prisma.forumPost.groupBy({
          by: ["authorId"],
          where: { forumId },
          _count: { id: true },
        }),
      ])

      return res.status(200).json({
        pending,
        pendingCount:     pending.length,
        totalPosts,
        participantCount: stats.length,
      })
    } catch (err) {
      console.error("[GET /api/forum/[forumId]/moderation]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  // PATCH — approuver ou rejeter en masse
  if (req.method === "PATCH") {
    try {
      const { postIds, action } = req.body

      if (!postIds?.length || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Paramètres invalides" })
      }

      if (action === "approve") {
        await prisma.forumPost.updateMany({
          where: { id: { in: postIds } },
          data:  { isApproved: true },
        })
      } else {
        await prisma.forumPost.deleteMany({
          where: { id: { in: postIds } },
        })
      }

      return res.status(200).json({ success: true, action, count: postIds.length })
    } catch (err) {
      console.error("[PATCH /api/forum/[forumId]/moderation]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" })
}