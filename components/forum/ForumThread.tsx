// components/forum/ForumThread.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Forum, ForumPost, ForumAuthor } from '@/types/forum.types'
import ForumPostComponent from './ForumPost'
import ReplyForm from './ReplyForm'

interface ForumThreadProps {
  forum: Forum
  rootPosts: ForumPost[]
  currentUser: ForumAuthor
}

type FilterType = 'all' | 'certified' | 'recent' | 'popular'

export default function ForumThread({
  forum,
  rootPosts,
  currentUser,
}: ForumThreadProps) {
  const [posts, setPosts] = useState<ForumPost[]>(rootPosts)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    setPosts(rootPosts)
  }, [rootPosts])

  const handleNewPost = (newPost: ForumPost) => {
    setPosts(prev => [...prev, newPost])
  }

  const handlePostUpdate = (updatedPost: ForumPost) => {
    const updateInTree = (list: ForumPost[]): ForumPost[] =>
      list.map(p =>
        p.id === updatedPost.id
          ? { ...updatedPost, children: p.children }
          : { ...p, children: updateInTree(p.children ?? []) }
      )
    setPosts(prev => updateInTree(prev))
  }

  const handleChildPost = (parentId: string, newPost: ForumPost) => {
    const addToParent = (list: ForumPost[]): ForumPost[] =>
      list.map(p =>
        p.id === parentId
          ? { ...p, children: [...(p.children ?? []), newPost] }
          : { ...p, children: addToParent(p.children ?? []) }
      )
    setPosts(prev => addToParent(prev))
  }

  const isOpen =
    forum.status === 'PUBLISHED' &&
    (!forum.closeAt || new Date(forum.closeAt) > new Date())

  // Filtrer et trier les posts
  const filteredPosts = useMemo(() => {
    let result = posts.filter(p =>
      p.content.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Appliquer le filtre
    if (filter === 'certified') {
      result = result.filter(p => p.author.role === 'TEACHER')
    } else if (filter === 'recent') {
      result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (filter === 'popular') {
      result = result.sort((a, b) => (b._count?.likes || 0) - (a._count?.likes || 0))
    }

    return result
  }, [posts, searchTerm, filter])

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">

      {/* ─────────────────────────────────────────────────────────── */}
      {/* EN-TÊTE */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {forum.title.replace(/chapitre\s*\d*\s*:?\s*/gi, "").trim()}
        </h1>
        <div className="h-1.5 w-24 bg-blue-600 rounded"></div>
      </div>

      {/* Description */}
      {forum.description && (
        <div className="mb-8 p-5 bg-blue-50 rounded-lg border border-blue-200">
          <div 
            className="text-[15px] leading-7 text-gray-700
              [&_p]:mb-2 [&_p:last-child]:mb-0
              [&_strong]:font-bold [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: forum.description }}
          />
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-[13px] text-gray-600">
          <strong className="text-gray-900">{posts.length}</strong> réponse{posts.length !== 1 ? 's' : ''} • 
          <strong className="ml-2 text-gray-900">{new Set(posts.map(p => p.author.id)).size}</strong> participant{new Set(posts.map(p => p.author.id)).size !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* RECHERCHE + FILTRES */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="mb-8 space-y-3">
        {/* Recherche */}
        <input
          type="text"
          placeholder="🔍 Rechercher dans le forum..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500 text-[14px]"
        />

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold text-[13px] transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes les réponses
          </button>
          <button
            onClick={() => setFilter('certified')}
            className={`px-4 py-2 rounded-lg font-semibold text-[13px] transition-colors ${
              filter === 'certified'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✓ Certifiées
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`px-4 py-2 rounded-lg font-semibold text-[13px] transition-colors ${
              filter === 'recent'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🕐 Récentes
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`px-4 py-2 rounded-lg font-semibold text-[13px] transition-colors ${
              filter === 'popular'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👍 Populaires
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* POSTS */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="mb-16 space-y-8">
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <div className="text-[15px] mb-2">💭 Aucune réponse trouvée</div>
            <p className="text-[13px]">
              {searchTerm ? 'Essayez une autre recherche' : 'Soyez le premier à répondre!'}
            </p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <ForumPostComponent
              key={post.id}
              post={post}
              depth={0}
              forumId={forum.id}
              currentUser={currentUser}
              onPostUpdate={handlePostUpdate}
              onChildPost={handleChildPost}
            />
          ))
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ZONE RÉPONSE */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-300 pt-12">
        {isOpen ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ✍️ Ajouter une réponse
            </h2>
            <ReplyForm
              forumId={forum.id}
              parentPostId={null}
              onSuccess={handleNewPost}
              onCancel={() => { }}
              autoFocus={false}
            />
          </div>
        ) : (
          <div className="text-center py-10 text-gray-600">
            {forum.status === 'DRAFT'
              ? '⏳ Forum en attente d\'activation'
              : '🔒 Cette discussion est fermée'}
          </div>
        )}
      </div>
    </div>
  )
}
