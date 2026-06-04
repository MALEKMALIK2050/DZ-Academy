// components/forum/ReplyForm.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import type { ForumPost } from '@/types/forum.types'
import { useAuth } from '@/context/AuthContext'

interface ReplyFormProps {
  forumId: string | number
  parentPostId: string | number | null
  onSuccess: (post: ForumPost) => void
  onCancel: () => void
  autoFocus?: boolean
}

const AVAILABLE_TAGS = [
  'Concept-clé',
  'Question simple',
  'Bug',
  'Débat',
  'FAQ',
  'Résolu',
]

export default function ReplyForm({
  forumId,
  parentPostId,
  onSuccess,
  onCancel,
  autoFocus = false,
}: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [selectedTag, setSelectedTag] = useState(AVAILABLE_TAGS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth() as any
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  const handleSubmit = async () => {
    if (!content.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/forum/${forumId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentPostId,
          tag: selectedTag,
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la publication')

      const data = await res.json()
      onSuccess(data.post)
      setContent('')
      setSelectedTag(AVAILABLE_TAGS[0])
    } catch (err) {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* TEXTAREA */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Écrivez votre réponse ici..."
        rows={10}
        className="w-full text-[15px] px-5 py-4 border-2 border-gray-300 rounded-lg
          outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          resize-none transition-all leading-relaxed font-normal
          bg-white placeholder-gray-400 hover:border-gray-400"
      />

      {/* MESSAGE D'ERREUR */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-2 border-red-300 rounded-lg text-[13px] text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* BARRE D'ACTIONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Tag selector */}
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500 text-[13px] font-semibold bg-white"
        >
          {AVAILABLE_TAGS.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        {/* Boutons */}
        <div className="flex gap-2 items-center w-full sm:w-auto">
          {parentPostId && (
            <button
              onClick={onCancel}
              className="text-[13px] px-5 py-2.5 text-gray-700 hover:text-gray-900 font-semibold 
                bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-1 sm:flex-none"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || loading}
            className="text-[13px] px-6 py-2.5 bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 
              disabled:cursor-not-allowed active:scale-95 flex-1 sm:flex-none"
          >
            {loading ? '⏳ Envoi...' : '📤 Publier'}
          </button>
        </div>
      </div>

      {/* CONSEIL */}
      <div className="text-[12px] text-gray-500">
        💡 Appuyez sur <code className="bg-gray-100 px-1.5 py-0.5 rounded">Ctrl+Entrée</code> pour publier rapidement
      </div>
    </div>
  )
}
