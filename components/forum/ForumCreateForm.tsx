// components/forum/ForumCreateForm.tsx
'use client'

import { useState, useEffect } from 'react'
import type { PostRole } from '@/components/forum/Avatar'

interface Chapter {
  id: number
  title: string
  ordre: number
}

interface Course {
  id: number
  title: string
  chapters: Chapter[]
}

interface ForumCreateFormProps {
  courses: Course[]
  onSuccess?: (forum: any) => void
}

export default function ForumCreateForm({ courses, onSuccess }: ForumCreateFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])

  const [form, setForm] = useState({
    title:          '',
    description:    '',
    type:           'OPEN',
    chapitreId:     '',
    position:       'END',
    isModerated:    false,
    isRequired:     false,
    allowAnonymous: false,
    isPeerReview:   false,
    notifyTeacher:  true,
    openAt:         '',
    closeAt:        '',
    status:         'DRAFT',
  })

  useEffect(() => {
    if (selectedCourseId) {
      const course = courses.find(c => c.id === selectedCourseId)
      setChapters(course?.chapters ?? [])
      setForm(f => ({ ...f, chapitreId: '' }))
    }
  }, [selectedCourseId, courses])

  const set = (key: string, value: any) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!form.title.trim() || !form.chapitreId) {
      setError('Titre et chapitre sont obligatoires')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status,
          courseId:   selectedCourseId,
          chapitreId: parseInt(form.chapitreId),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur serveur')
      }

      const data = await res.json()
      setSuccess(true)
      onSuccess?.(data.forum)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl p-6 text-center">
        <div className="text-[15px] font-medium text-green-700 mb-1">Forum créé avec succès</div>
        <p className="text-[13px] text-green-600">Il apparaîtra dans le chapitre sélectionné.</p>
        <button
          onClick={() => { setSuccess(false); setForm(f => ({ ...f, title: '', description: '' })) }}
          className="mt-4 text-[12px] px-4 py-1.5 border border-green-300 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
        >
          Créer un autre forum
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Informations générales */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-3">
          Informations générales
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">
              Titre du forum <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ex : Discussion sur les concepts du chapitre"
              className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">
              Consigne / description
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Expliquez aux apprenants l'objectif de cette discussion..."
              rows={3}
              className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">
                Type de forum
              </label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300 bg-white"
              >
                <option value="OPEN">Discussion ouverte</option>
                <option value="QA">Questions / Réponses</option>
                <option value="DEBATE">Débat structuré</option>
                <option value="BRAINSTORM">Remue-méninges</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">
                Position dans le chapitre
              </label>
              <select
                value={form.position}
                onChange={e => set('position', e.target.value)}
                className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300 bg-white"
              >
                <option value="START">En début de chapitre</option>
                <option value="AFTER_VIDEO">Après la vidéo</option>
                <option value="AFTER_IMAGE">Après l'image</option>
                <option value="AFTER_TEXT">Après le texte</option>
                <option value="AFTER_QCM">Après le QCM</option>
                <option value="AFTER_DEVOIR">Après le devoir</option>
                <option value="END">En fin de chapitre</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Placement */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-3">
          Placement dans le cours
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">
              Cours
            </label>
            <select
              value={selectedCourseId ?? ''}
              onChange={e => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300 bg-white"
            >
              <option value="">Sélectionner un cours</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {chapters.length > 0 && (
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">
                Chapitre <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {chapters.map(ch => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => set('chapitreId', ch.id.toString())}
                    className={`text-left px-3 py-2 rounded-lg border text-[12px] transition-colors ${
                      form.chapitreId === ch.id.toString()
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-[10px] text-gray-400 mb-0.5">
                      Section {ch.ordre + 1}
                    </div>
                    <div className="truncate">{ch.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Paramètres */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-3">
          Paramètres d'animation
        </div>

        <div className="space-y-0 divide-y divide-gray-100">
          {[
            { key: 'isModerated',    label: 'Modération avant publication',    desc: 'Chaque message est validé avant d\'être visible' },
            { key: 'isRequired',     label: 'Participation obligatoire',        desc: 'L\'apprenant doit poster pour progresser' },
            { key: 'allowAnonymous', label: 'Réponses anonymes autorisées',     desc: 'Les apprenants peuvent poster sans afficher leur nom' },
            { key: 'isPeerReview',   label: 'Évaluation par les pairs',         desc: 'Les apprenants peuvent noter les contributions' },
            { key: 'notifyTeacher',  label: 'Notifier le formateur par email',  desc: 'Recevoir un email à chaque nouveau message' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-[13px] text-gray-800">{label}</div>
                <div className="text-[11px] text-gray-400">{desc}</div>
              </div>
              <button
                type="button"
                onClick={() => set(key, !(form as any)[key])}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ml-4 ${
                  (form as any)[key] ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    (form as any)[key] ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wide mb-3">
          Dates d'accès (optionnel)
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">
              Date d'ouverture
            </label>
            <input
              type="datetime-local"
              value={form.openAt}
              onChange={e => set('openAt', e.target.value)}
              className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">
              Date de fermeture
            </label>
            <input
              type="datetime-local"
              value={form.closeAt}
              onChange={e => set('closeAt', e.target.value)}
              className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300"
            />
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={() => handleSubmit('DRAFT')}
          disabled={loading}
          className="text-[13px] px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Enregistrer brouillon
        </button>
        <button
          onClick={() => handleSubmit('PUBLISHED')}
          disabled={loading}
          className="text-[13px] px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Publication...' : 'Publier le forum'}
        </button>
      </div>
    </div>
  )
}