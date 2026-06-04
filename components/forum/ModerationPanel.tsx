// components/forum/ModerationPanel.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Avatar from './Avatar'
import type { PostRole } from '@/components/forum/Avatar'

interface PendingPost {
  id:          number
  content:     string
  createdAt:   string
  isAnonymous: boolean
  author: {
    id:     number
    nom:    string
    prenom: string
    role:   PostRole
  }
}

interface Stats {
  pendingCount:     number
  totalPosts:       number
  participantCount: number
}

interface ModerationPanelProps {
  forumId: number
}

export default function ModerationPanel({ forumId }: ModerationPanelProps) {
  const [pending, setPending]   = useState<PendingPost[]>([])
  const [stats, setStats]       = useState<Stats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<number[]>([])
  const [acting, setActing]     = useState(false)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/forum/${forumId}/moderation`)
      const data = await res.json()
      setPending(data.pending ?? [])
      setStats({
        pendingCount:     data.pendingCount,
        totalPosts:       data.totalPosts,
        participantCount: data.participantCount,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [forumId])

  useEffect(() => { fetchPending() }, [fetchPending])

  const toggleSelect = (id: number) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const toggleAll = () =>
    setSelected(
      selected.length === pending.length ? [] : pending.map(p => p.id)
    )

  const act = async (action: 'approve' | 'reject') => {
    if (!selected.length) return
    setActing(true)
    try {
      await fetch(`/api/forum/${forumId}/moderation`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ postIds: selected, action }),
      })
      setSelected([])
      await fetchPending()
    } catch (err) {
      console.error(err)
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total posts',  value: stats.totalPosts,       warn: false },
            { label: 'En attente',   value: stats.pendingCount,     warn: stats.pendingCount > 0 },
            { label: 'Participants', value: stats.participantCount, warn: false },
          ].map(({ label, value, warn }) => (
            <div
              key={label}
              className={`rounded-xl p-3 text-center border ${
                warn ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className={`text-[22px] font-medium ${warn ? 'text-amber-700' : 'text-gray-800'}`}>
                {value}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Barre d'actions */}
      {pending.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <input
            type="checkbox"
            checked={selected.length === pending.length && pending.length > 0}
            onChange={toggleAll}
            className="w-3.5 h-3.5 accent-blue-600"
          />
          <span className="text-[12px] text-gray-500 flex-1">
            {selected.length > 0
              ? `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}`
              : 'Tout sélectionner'}
          </span>
          {selected.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => act('approve')}
                disabled={acting}
                className="text-[12px] px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                ✓ Approuver
              </button>
              <button
                onClick={() => act('reject')}
                disabled={acting}
                className="text-[12px] px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                ✕ Rejeter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Liste des posts en attente */}
      {loading ? (
        <div className="text-center py-8 text-[13px] text-gray-400">
          Chargement...
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
          <div className="text-[13px] text-gray-400">Aucun message en attente de modération</div>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map(post => (
            <div
              key={post.id}
              onClick={() => toggleSelect(post.id)}
              className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selected.includes(post.id)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(post.id)}
                onChange={() => toggleSelect(post.id)}
                onClick={e => e.stopPropagation()}
                className="w-3.5 h-3.5 accent-blue-600 mt-1 shrink-0"
              />

              <Avatar
                firstName={post.isAnonymous ? '?' : post.author.prenom}
                lastName={post.isAnonymous  ? '' : post.author.nom}
                role={post.author.role}
                size="sm"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[12px] font-medium text-gray-800">
                    {post.isAnonymous
                      ? 'Anonyme'
                      : `${post.author.prenom} ${post.author.nom}`}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                    {post.author.role === 'TEACHER' ? 'Enseignant' : 'Élève'}
                  </span>
                  <span className="text-[11px] text-gray-400 ml-auto">
                    {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                      day:    'numeric',
                      month:  'short',
                      hour:   '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed line-clamp-3">
                  {post.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rafraîchir */}
      <div className="flex justify-end">
        <button
          onClick={fetchPending}
          className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          ↻ Rafraîchir
        </button>
      </div>
    </div>
  )
}