"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronRight, Save, Loader2, BookOpen } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

export default function CourseCreateForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId) {
      alert("Veuillez remplir le titre et sélectionner une catégorie !");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId: parseInt(categoryId),
          templateId: templateId ? parseInt(templateId) : null
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Une erreur est survenue lors de l'enregistrement");
      }

      const newCourse = await res.json();
      router.push(`/dashboard/teacher/courses/${newCourse.id}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
      
      {templateId && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-3 text-xs">
          <BookOpen className="w-5 h-5 shrink-0 text-amber-600" />
          <span>Création basée sur le modèle temporaire ID <strong>#{templateId}</strong>. Les chapitres par défaut seront pré-générés.</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-705 uppercase tracking-wider mb-2">Titre du Cours</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex: Fondamentaux du Développement Web..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-705 uppercase tracking-wider mb-2">Catégorie Académique</label>
        <select 
          value={categoryId} 
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition cursor-pointer"
        >
          <option value="">Sélectionnez une catégorie...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-705 uppercase tracking-wider mb-2">Description</label>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Présentation du syllabus et compétences visées..."
          rows={4}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition resize-none"
        />
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Enregistrer et Poursuivre
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}