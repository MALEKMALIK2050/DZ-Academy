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
  teacherId: string | number
) {
  const { title, description, chapitreId, isModerated } = payload
  
  return prisma.forum.create({
    data: {
      title,
      description: description || "",
      chapitreId: typeof chapitreId === 'string' ? parseInt(chapitreId, 10) : chapitreId,
      isModerated: isModerated ?? false,
      createdById: typeof teacherId === 'string' ? parseInt(teacherId, 10) : teacherId,
      status: 'DRAFT',
    },
  })
}

export async function getForumByChapitreId(chapitreId: string | number) {
  return prisma.forum.findFirst({
    where: {
      chapitreId: typeof chapitreId === 'string' ? parseInt(chapitreId, 10) : chapitreId,
      status: 'PUBLISHED',
    },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function getForumWithPosts(forumId: string | number) {
  const forumIdNum = typeof forumId === 'string' ? parseInt(forumId, 10) : forumId
  
  const forum = await prisma.forum.findUnique({
    where: { id: forumIdNum },
  })

  if (!forum) return null

  const flatPosts = await prisma.forumPost.findMany({
    where: {
      forumId: forumIdNum,
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

  const rootPosts = buildPostTree(flatPosts as unknown as ForumPost[])

  return { forum, rootPosts }
}

export async function updateForum(
  forumId: string | number,
  payload: UpdateForumPayload
) {
  const forumIdNum = typeof forumId === 'string' ? parseInt(forumId, 10) : forumId
  
  const updateData: any = {}
  if (payload.title !== undefined) updateData.title = payload.title
  if (payload.description !== undefined) updateData.description = payload.description
  if (payload.status !== undefined) updateData.status = payload.status
  if (payload.isModerated !== undefined) updateData.isModerated = payload.isModerated
  
  return prisma.forum.update({
    where: { id: forumIdNum },
    data: updateData,
  })
}

export async function deleteForum(forumId: string | number) {
  const forumIdNum = typeof forumId === 'string' ? parseInt(forumId, 10) : forumId
  return prisma.forum.delete({
    where: { id: forumIdNum },
  })
}

export async function publishForum(forumId: string | number) {
  const forumIdNum = typeof forumId === 'string' ? parseInt(forumId, 10) : forumId
  return prisma.forum.update({
    where: { id: forumIdNum },
    data: { status: 'PUBLISHED' },
  })
}

// ─── Posts CRUD ──────────────────────────────────────

export async function createPost(
  forumId: string | number,
  authorId: string | number,
  payload: CreatePostPayload
) {
  const forumIdNum = typeof forumId === 'string' ? parseInt(forumId, 10) : forumId
  const authorIdNum = typeof authorId === 'string' ? parseInt(authorId, 10) : authorId
  
  let depth = 0
  if (payload.parentId) {
    const parentIdNum = typeof payload.parentId === 'string' ? parseInt(payload.parentId, 10) : payload.parentId
    const parent = await prisma.forumPost.findUnique({
      where: { id: parentIdNum },
      select: { depth: true },
    })
    depth = (parent?.depth ?? 0) + 1
  }

  const forum = await prisma.forum.findUnique({
    where: { id: forumIdNum },
    select: { isModerated: true },
  })

  return prisma.forumPost.create({
    data: {
      forumId: forumIdNum,
      authorId: authorIdNum,
      content: payload.content,
      parentId: payload.parentId ? (typeof payload.parentId === 'string' ? parseInt(payload.parentId, 10) : payload.parentId) : null,
      isAnonymous: payload.isAnonymous ?? false,
      isApproved: !forum?.isModerated,
      isFeedback: payload.isFeedback ?? false,
      depth,
    },
    include: {
      author: { select: authorSelect },
      _count: { select: { likes: true, children: true } },
    },
  })
}

export async function updatePost(
  postId: string | number,
  payload: UpdatePostPayload
) {
  const postIdNum = typeof postId === 'string' ? parseInt(postId, 10) : postId
  
  const updateData: any = {}
  if (payload.content !== undefined) updateData.content = payload.content
  if (payload.isFeedback !== undefined) updateData.isFeedback = payload.isFeedback
  if (payload.isApproved !== undefined) updateData.isApproved = payload.isApproved
  if (payload.grade !== undefined) updateData.grade = payload.grade
  if (payload.feedback !== undefined) updateData.feedback = payload.feedback
  
  return prisma.forumPost.update({
    where: { id: postIdNum },
    data: updateData,
    include: {
      author: { select: authorSelect },
    },
  })
}

export async function deletePost(postId: string | number) {
  const postIdNum = typeof postId === 'string' ? parseInt(postId, 10) : postId
  return prisma.forumPost.delete({
    where: { id: postIdNum },
  })
}

export async function approvePost(postId: string | number) {
  const postIdNum = typeof postId === 'string' ? parseInt(postId, 10) : postId
  return prisma.forumPost.update({
    where: { id: postIdNum },
    data: { isApproved: true },
  })
}

export async function markAsFeedback(postId: string | number) {
  const postIdNum = typeof postId === 'string' ? parseInt(postId, 10) : postId
  return prisma.forumPost.update({
    where: { id: postIdNum },
    data: { isFeedback: true },
  })
}

// ─── Likes ───────────────────────────────────────────

export async function toggleLike(
  postId: string | number,
  userId: string | number
): Promise<{ liked: boolean; count: number }> {
  const postIdNum = typeof postId === 'string' ? parseInt(postId, 10) : postId
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId
  
  const existing = await prisma.forumPostLike.findUnique({
    where: { postId_userId: { postId: postIdNum, userId: userIdNum } },
  })

  if (existing) {
    await prisma.forumPostLike.delete({
      where: { postId_userId: { postId: postIdNum, userId: userIdNum } },
    })
  } else {
    await prisma.forumPostLike.create({
      data: { postId: postIdNum, userId: userIdNum },
    })
  }

  const count = await prisma.forumPostLike.count({
    where: { postId: postIdNum },
  })

  return { liked: !existing, count }
}

// ─── Modération ──────────────────────────────────────

export async function getPendingPosts(forumId: string | number) {
  const forumIdNum = typeof forumId === 'string' ? parseInt(forumId, 10) : forumId
  return prisma.forumPost.findMany({
    where: {
      forumId: forumIdNum,
      isApproved: false,
    },
    include: {
      author: { select: authorSelect },
    },
    orderBy: { createdAt: 'asc' },
  })
}

// ─── Stats pour le dashboard teacher ─────────────────

export async function getForumStats(forumId: string | number) {
  const forumIdNum = typeof forumId === 'string' ? parseInt(forumId, 10) : forumId
  
  const [totalPosts, pendingPosts, participants] = await Promise.all([
    prisma.forumPost.count({ where: { forumId: forumIdNum } }),
    prisma.forumPost.count({ where: { forumId: forumIdNum, isApproved: false } }),
    prisma.forumPost.groupBy({
      by: ['authorId'],
      where: { forumId: forumIdNum },
    }),
  ])

  return {
    totalPosts,
    pendingPosts,
    participantCount: participants.length,
  }
}