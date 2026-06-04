// types/forum.types.ts

export type ForumType = 'OPEN' | 'QA' | 'DEBATE' | 'BRAINSTORM'

export type ForumPosition =
  | 'AFTER_VIDEO'
  | 'AFTER_IMAGE'
  | 'AFTER_TEXT'
  | 'AFTER_QCM'
  | 'AFTER_DEVOIR'
  | 'START'
  | 'END'

export type ForumStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'

export type PostRole = 'ADMIN' | 'DESIGNER' | 'TEACHER' | 'STUDENT'


// ─── Forum ───────────────────────────────────────────

export interface Forum {
  id: string
  title: string
  description?: string
  type: ForumType
  chapitreId: string
  moduleId?: string
  courseId?: string
  position: ForumPosition
  status: ForumStatus
  isModerated: boolean
  isRequired: boolean
  allowAnonymous: boolean
  isPeerReview: boolean
  notifyTeacher: boolean
  openAt?: Date
  closeAt?: Date
  createdAt: Date
  updatedAt: Date
  posts?: ForumPost[]
  _count?: {
    posts: number
  }
}

// ─── Post (nœud de l'arbre) ──────────────────────────

export interface ForumPost {
  id: string
  forumId: string
  authorId: string
  parentId: string | null       // null = réponse directe à la question
  content: string
  depth: number                 // 0 = réponse racine, 1 = sous-réponse, etc.
  isFeedback: boolean           // feedback officiel teacher
  isApproved: boolean           // validé par modération
  isAnonymous: boolean
  createdAt: Date
  updatedAt: Date
  grade?: number | null         // Note de 0 à 5
  feedback?: string | null      // Commentaire du formateur
  gradedAt?: Date | null        // Quand noté
  gradedById?: number | null    // ID du formateur
  author: ForumAuthor
  gradedBy?: ForumAuthor        // Info du formateur qui a noté
  children?: ForumPost[]        // sous-réponses (récursif)
  likes?: ForumPostLike[]
  _count?: {
    likes: number
    children: number
  }
}

// ─── Auteur ──────────────────────────────────────────

export interface ForumAuthor {
  id: string | number
  firstName?: string
  lastName?: string
  prenom?: string
  nom?: string
  role: PostRole
  avatarUrl?: string
}

// ─── Like ────────────────────────────────────────────

export interface ForumPostLike {
  id: string
  postId: string
  userId: string
}

// ─── Payloads API ────────────────────────────────────

export interface CreateForumPayload {
  title: string
  description?: string
  type: ForumType
  chapitreId: string
  position: ForumPosition
  isModerated: boolean
  isRequired: boolean
  allowAnonymous: boolean
  isPeerReview: boolean
  notifyTeacher: boolean
  openAt?: string
  closeAt?: string
}

export interface UpdateForumPayload {
  title?: string
  description?: string
  status?: ForumStatus
  isModerated?: boolean
  isRequired?: boolean
  openAt?: string
  closeAt?: string
}

export interface CreatePostPayload {
  content: string
  parentId?: string | null
  isAnonymous?: boolean
  isFeedback?: boolean
}

export interface UpdatePostPayload {
  content?: string
  isFeedback?: boolean
  isApproved?: boolean
  grade?: number
  feedback?: string
}

// ─── Réponses API ────────────────────────────────────

export interface ForumResponse {
  forum: Forum
  rootPosts: ForumPost[]        // arbre complet, children imbriqués
}

export interface PostResponse {
  post: ForumPost
}

export interface LikeResponse {
  liked: boolean
  count: number
}

// ─── Props composants ────────────────────────────────

export interface ForumThreadProps {
  forum: Forum
  rootPosts: ForumPost[]
  currentUser: ForumAuthor
}

export interface ForumPostProps {
  post: ForumPost
  depth: number
  currentUser: ForumAuthor
  forumId: string
}

export interface ReplyFormProps {
  forumId: string
  parentPostId: string | null
  onSuccess: (post: ForumPost) => void
  onCancel: () => void
}
