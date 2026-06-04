// components/forum/ForumPost.tsx
'use client'

import { useState } from 'react'
import type { ForumPost, ForumAuthor } from '@/types/forum.types'
import ReplyForm from './ReplyForm'
import type { PostRole } from '@/components/forum/Avatar'

interface ForumPostProps {
  post: ForumPost
  depth: number
  forumId: string
  currentUser: ForumAuthor
  onPostUpdate: (post: ForumPost) => void
  onChildPost: (parentId: string, post: ForumPost) => void
  parentPost?: ForumPost
}

export default function ForumPost({
  post,
  depth,
  forumId,
  currentUser,
  onPostUpdate,
  onChildPost,
  parentPost,
}: ForumPostProps) {
  const [showReply, setShowReply] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [thumbsUp, setThumbsUp] = useState(0)
  const [thumbsDown, setThumbsDown] = useState(0)

  const isTeacher = post.author.role === 'TEACHER'
  const hasChildren = (post.children?.length ?? 0) > 0
  const MAX_DEPTH = 3
  const isCertified = isTeacher && depth === 1 // Les réponses directes du formateur sont certifiées

  const handleReplySuccess = (newPost: ForumPost) => {
    onChildPost(post.id, newPost)
    setShowReply(false)
  }

  const formatDateTime = (date: Date) => {
    const d = new Date(date)
    const day = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return `${day} - ${time}`
  }

  // Déterminer les tags (exemple simple)
  const getTags = () => {
    const tags = []
    if (isCertified) tags.push('Réponse certifiée')
    if (depth === 0) tags.push('Question')
    if (hasChildren) tags.push('Débattu')
    return tags.length > 0 ? tags : ['Contribution']
  }

  const bgColor = isCertified ? 'bg-green-50' : isTeacher ? 'bg-orange-50' : 'bg-white'
  const borderColor = isCertified ? 'border-l-4 border-green-500' : isTeacher ? 'border-l-4 border-orange-400' : 'border-l-4 border-gray-300'

  return (
    <div className={`w-full ${depth > 0 ? 'mt-8' : 'mb-10'}`}>
      <div className={`${borderColor} ${bgColor} p-7 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200`}>
        
        {/* ─────────────────────────────────────────────────────────── */}
        {/* EN-TÊTE: NOM + DATE + BADGES */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-4 pb-4 border-b border-gray-300">
          {/* Nom + Rôle */}
          <div>
            <span className="text-[16px] font-bold text-gray-900">
              {post.isAnonymous
                ? 'Anonyme'
                : `${post.author.prenom || post.author.firstName || 'Anonyme'} ${post.author.nom || post.author.lastName || ''}`}
            </span>
            {isTeacher && (
              <span className="text-[12px] text-gray-700 ml-2">
                (FORMATEUR)
              </span>
            )}
          </div>

          {/* Date + Rating */}
          <div className="flex items-center gap-3 text-[13px] text-gray-600">
            <span>{formatDateTime(post.createdAt)}</span>
            {depth !== 0 && (
              <span className="text-yellow-500 font-semibold">
                ⭐ 4.5/5
              </span>
            )}
          </div>
        </div>

        {/* "En réponse à..." */}
        {parentPost && depth > 0 && (
          <div className="text-[12px] text-gray-600 italic mb-3 pl-3 border-l-2 border-gray-300">
            En réponse à <strong>{parentPost.author.prenom} {parentPost.author.nom}</strong>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {getTags().map((tag, idx) => (
            <span key={idx} className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
              tag === 'Réponse certifiée'
                ? 'bg-green-200 text-green-900'
                : tag === 'Question'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {tag === 'Réponse certifiée' ? '✓ ' : ''}{tag}
            </span>
          ))}
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* CONTENU */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div
            className="text-[15px] leading-7 text-gray-800
              [&_p]:mb-3 [&_p:last-child]:mb-0
              [&_strong]:font-bold [&_em]:italic
              [&_a]:text-blue-600 [&_a:hover]:underline
              [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2
              [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* ACTIONS: RÉPONDRE + VOTES + COLLAPSE */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-300">

          {/* Répondre */}
          {depth < MAX_DEPTH && (
            <button
              onClick={() => setShowReply(v => !v)}
              className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {showReply ? '▼ Répondre (masquer)' : '▶ Répondre'}
            </button>
          )}

          {/* Votes simples */}
          <div className="flex items-center gap-3 text-[13px]">
            <button
              onClick={() => setThumbsUp(thumbsUp + 1)}
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              👍 {thumbsUp}
            </button>
            <button
              onClick={() => setThumbsDown(thumbsDown + 1)}
              className="text-gray-600 hover:text-red-600 transition-colors"
            >
              👎 {thumbsDown}
            </button>
          </div>

          {/* Collapse replies */}
          {hasChildren && (
            <button
              onClick={() => setCollapsed(v => !v)}
              className="text-[13px] font-semibold text-gray-600 hover:text-gray-800 ml-auto transition-colors"
            >
              {collapsed ? '▶' : '▼'} {post.children!.length} réponse{post.children!.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* REPLY FORM */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showReply && (
        <div className={`mt-4 ${depth > 0 ? 'ml-0 sm:ml-8' : 'ml-0'}`}>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <ReplyForm
              forumId={forumId}
              parentPostId={post.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setShowReply(false)}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* RÉPONSES IMBRIQUÉES */}
      {/* ─────────────────────────────────────────────────────────── */}
      {!collapsed && hasChildren && (
        <div className={`mt-6 space-y-6 ${depth > 0 ? 'ml-0 sm:ml-8' : 'ml-0 sm:ml-10'}`}>
          {post.children!.map((child) => (
            <ForumPost
              key={child.id}
              post={child}
              depth={depth + 1}
              forumId={forumId}
              currentUser={currentUser}
              onPostUpdate={onPostUpdate}
              onChildPost={onChildPost}
              parentPost={post}
            />
          ))}
        </div>
      )}
    </div>
  )
}
