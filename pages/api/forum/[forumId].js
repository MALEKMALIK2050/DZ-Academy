// pages/api/forum/[forumId].js
import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

// Reconstruit l'arbre récursif des posts depuis une liste plate
function buildPostTree(posts) {
  const map = new Map()
  const roots = []

  posts.forEach(post => {
    map.set(post.id, { ...post, children: [] })
  })

  map.forEach(post => {
    if (post.parentId === null || post.parentId === undefined) {
      roots.push(post)
    } else {
      const parent = map.get(post.parentId)
      if (parent) {
        parent.children = parent.children ?? []
        parent.children.push(post)
      }
    }
  })
  

  return roots
}

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
  if (isNaN(forumId)) return res.status(400).json({ error: "forumId invalide" })


  // GET — forum complet avec arbre de posts
  if (req.method === "GET") {
    try {
      const forum = await prisma.forum.findUnique({
        where: { id: forumId },
        include: {
          createdBy: { select: authorSelect },
          chapter: { select: { id: true, title: true } },
          _count: { select: { posts: true } },
        },
      })

      if (!forum) return res.status(404).json({ error: "Forum introuvable" })

                const flatPosts = await prisma.forumPost.findMany({
                  where: {
                    forumId,
                    ...(forum.isModerated ? { isApproved: true } : {}),
                  },
                  include: {
                    author: { select: authorSelect },
                    gradedBy: { select: { id: true, nom: true, prenom: true } }, // ✅ AJOUTER
                    likes: { select: { userId: true } },
                    _count: { select: { likes: true, children: true } },
                  },
                  orderBy: { createdAt: "asc" },
                })

      const rootPosts = buildPostTree(flatPosts)

      return res.status(200).json({ forum, rootPosts })
    } catch (err) {
      console.error("[GET /api/forum/[forumId]]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  // PATCH — modifier le forum
  if (req.method === "PATCH") {
    if (!["TEACHER", "DESIGNER", "ADMIN"].includes(user.role)) {
      return res.status(403).json({ error: "Accès refusé" })
    }
    try {
      const {
        title, description, status, position,
        isModerated, isRequired, allowAnonymous,
        isPeerReview, notifyTeacher, openAt, closeAt,
      } = req.body

      const forum = await prisma.forum.update({
        where: { id: forumId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(position !== undefined && { position }),
          ...(isModerated !== undefined && { isModerated }),
          ...(isRequired !== undefined && { isRequired }),
          ...(allowAnonymous !== undefined && { allowAnonymous }),
          ...(isPeerReview !== undefined && { isPeerReview }),
          ...(notifyTeacher !== undefined && { notifyTeacher }),
          ...(openAt !== undefined && { openAt: openAt ? new Date(openAt) : null }),
          ...(closeAt !== undefined && { closeAt: closeAt ? new Date(closeAt) : null }),
        },
      })
      return res.status(200).json({ forum })
    } catch (err) {
      console.error("[PATCH /api/forum/[forumId]]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  // DELETE — supprimer le forum
  if (req.method === "DELETE") {
    if (!["TEACHER", "DESIGNER", "ADMIN"].includes(user.role)) {
      return res.status(403).json({ error: "Accès refusé" })
    }
    try {
      await prisma.forum.delete({ where: { id: forumId } })
      return res.status(200).json({ success: true })
    } catch (err) {
      console.error("[DELETE /api/forum/[forumId]]", err)
      return res.status(500).json({ error: "Erreur serveur" })
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" })
}