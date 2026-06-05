"use client";
import { useEffect, useState } from "react";


export default function StudentCoursesPage() {
  const [data, setData] = useState({ catalogue: [], enrollments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/student/courses")
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les cours");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-extrabold text-slate-800 border-b border-slate-100 pb-4 mb-6">Catalogue & Inscriptions</h1>
      
      {loading && <p className="text-slate-500 animate-pulse">Chargement en cours...</p>}
      {error && <p className="text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">{error}</p>}
      
      {!loading && !error && (
        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-4">Mes Inscriptions ({data.enrollments?.length || 0})</h2>
            {data.enrollments?.length === 0 ? (
              <p className="text-slate-400 italic">Vous n'êtes inscrit à aucun cours.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.enrollments.map((e) => (
                  <div key={e.id} className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{e.course?.title || "Cours"}</h3>
                    <p className="text-xs text-indigo-600 font-medium mb-3">Statut: {e.statut}</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full" style={{ width: `${e.progression || 0}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-400 mt-2 block">Progression : {e.progression || 0}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-4">Catalogue des Cours ({data.catalogue?.length || 0})</h2>
            {data.catalogue?.length === 0 ? (
              <p className="text-slate-400 italic">Aucun cours n'est actuellement publié.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.catalogue.map((c) => (
                  <div key={c.id} className="p-5 bg-white border border-slate-105 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{c.title}</h3>
                    <p className="text-sm text-slate-500 mb-4">Niveau : {c.niveau} • Matière : {c.matiere}</p>
                    <span className="text-xs text-slate-400 block">Créé par l'équipe pédagogique</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}