// lib/forum.ts

import prisma from '@/lib/prisma'
import type {
  CreateForumPayload,
  UpdateForumPayload,
  CreatePostPayload,
  UpdatePostPayload,
  ForumPost,
} from '@/types/forum.types'

// ─── Helpers ─────────────────────────────────────────

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
  avatarUrl: true,
}

// Construit l'arbre récursif des posts à partir d'une liste plate
export function buildPostTree(posts: ForumPost[]): ForumPost[] {
  const map = new Map<string, ForumPost>()
  const roots: ForumPost[] = []

  posts.forEach(post => {
    map.set(post.id, { ...post, children: [] })
  })

  map.forEach(post => {
    if (post.parentId === null) {
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

// ─── Forum CRUD ──────────────────────────────────────

export async function createForum(
  payload: CreateForumPayload,
  teacherId: string
) {
  return prisma.forum.create({
    data: {
      ...payload,
      createdById: teacherId,
      status: 'DRAFT',
    },
  })
}

export async function getForumByChapitreId(chapitreId: string) {
  return prisma.forum.findFirst({
    where: {
      chapitreId,
      status: 'PUBLISHED',
    },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function getForumWithPosts(forumId: string) {
  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
  })

  if (!forum) return null

  // Récupère tous les posts à plat, triés par date
  const flatPosts = await prisma.forumPost.findMany({
    where: {
      forumId,
      ...(forum.isModerated ? { isApproved: true } : {}),
    },
    include: {
      author: { select: authorSelect },
      likes: true,
      _count: {
        select: { children: true, likes: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Convertit en arbre
  const rootPosts = buildPostTree(flatPosts as unknown as ForumPost[])

  return { forum, rootPosts }
}

export async function updateForum(
  forumId: string,
  payload: UpdateForumPayload
) {
  return prisma.forum.update({
    where: { id: forumId },
    data: payload,
  })
}

export async function deleteForum(forumId: string) {
  return prisma.forum.delete({
    where: { id: forumId },
  })
}

export async function publishForum(forumId: string) {
  return prisma.forum.update({
    where: { id: forumId },
    data: { status: 'PUBLISHED' },
  })
}

// ─── Posts CRUD ──────────────────────────────────────

export async function createPost(
  forumId: string,
  authorId: string,
  payload: CreatePostPayload
) {
  // Calcule la profondeur selon le parent
  let depth = 0
  if (payload.parentId) {
    const parent = await prisma.forumPost.findUnique({
      where: { id: payload.parentId },
      select: { depth: true },
    })
    depth = (parent?.depth ?? 0) + 1
  }

  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
    select: { isModerated: true },
  })

  return prisma.forumPost.create({
    data: {
      forumId,
      authorId,
      content: payload.content,
      parentId: payload.parentId ?? null,
      isAnonymous: payload.isAnonymous ?? false,
      isApproved: !forum?.isModerated,  // auto-approuvé si pas de modération
      isFeedback: false,
      depth,
    },
    include: {
      author: { select: authorSelect },
      _count: { select: { likes: true, children: true } },
    },
  })
}

export async function updatePost(
  postId: string,
  payload: UpdatePostPayload
) {
  return prisma.forumPost.update({
    where: { id: postId },
    data: payload,
    include: {
      author: { select: authorSelect },
    },
  })
}

export async function deletePost(postId: string) {
  return prisma.forumPost.delete({
    where: { id: postId },
  })
}

export async function approvePost(postId: string) {
  return prisma.forumPost.update({
    where: { id: postId },
    data: { isApproved: true },
  })
}

export async function markAsFeedback(postId: string) {
  return prisma.forumPost.update({
    where: { id: postId },
    data: { isFeedback: true },
  })
}

// ─── Likes ───────────────────────────────────────────

export async function toggleLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; count: number }> {
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

  return { liked: !existing, count }
}

// ─── Modération ──────────────────────────────────────

export async function getPendingPosts(forumId: string) {
  return prisma.forumPost.findMany({
    where: {
      forumId,
      isApproved: false,
    },
    include: {
      author: { select: authorSelect },
    },
    orderBy: { createdAt: 'asc' },
  })
}

// ─── Stats pour le dashboard teacher ─────────────────

export async function getForumStats(forumId: string) {
  const [totalPosts, pendingPosts, participants] = await Promise.all([
    prisma.forumPost.count({ where: { forumId } }),
    prisma.forumPost.count({ where: { forumId, isApproved: false } }),
    prisma.forumPost.groupBy({
      by: ['authorId'],
      where: { forumId },
    }),
  ])

  return {
    totalPosts,
    pendingPosts,
    participantCount: participants.length,
  }
}