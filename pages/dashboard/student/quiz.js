import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function StudentQuizPage() {
  const router = useRouter();
  // id correspond à la clé d'URL ex: ?id=3
  const { id: quizId } = router.query;

  const [quizInfo, setQuizInfo] = useState(null);
  const [reponses, setReponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resultat, setResultat] = useState(null);

  useEffect(() => {
    if (!quizId) return;

    fetch(`/api/student/quiz?quizId=${quizId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de récupérer les détails du quiz");
        return res.json();
      })
      .then((data) => {
        setQuizInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [quizId]);

  const handleInputChange = (questionId, value) => {
    setReponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleCheckboxChange = (questionId, value) => {
    setReponses((prev) => {
      const current = prev[questionId] || [];
      const updated = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      return { ...prev, [questionId]: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/student/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, reponses }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la soumission");

      setResultat(data);
      
      // Rafraîchir les informations de tentative
      const updatedInfo = await fetch(`/api/student/quiz?quizId=${quizId}`).then((r) => r.json());
      setQuizInfo((prev) => ({ ...prev, ...updatedInfo }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-gray-600 font-medium">Chargement du quiz...</div>
      </div>
    );
  }

  if (error && !quizInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-md text-center shadow">
          <p className="font-semibold">Une erreur est survenue</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 animate-pulse">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-8 text-white">
          <h1 className="text-2xl font-bold tracking-tight">{quizInfo?.title || "Quiz Évaluation"}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-300">
            <span>Tentatives : <strong className="text-white">{quizInfo?.tentatives}</strong> / {quizInfo?.maxTentatives === Infinity ? "Illimitées" : quizInfo?.maxTentatives}</span>
            {quizInfo?.score !== null && (
              <span>Dernier score : <strong className={quizInfo?.reussi ? "text-emerald-400" : "text-amber-400"}>{quizInfo?.score}%</strong></span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {/* Bloqué suite à épuisement de tentatives */}
          {quizInfo?.bloque ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-center">
              <span className="text-3xl">⛔</span>
              <h2 className="text-lg font-bold text-red-800 mt-2">Tentatives épuisées</h2>
              <p className="text-red-700 mt-2 max-w-md mx-auto">
                Vous avez atteint la limite de tentatives autorisées pour ce quiz. Contactez votre enseignant pour une remédiation.
              </p>
              <button type="button" onClick={() => router.back()} className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition">
                Retour aux chapitres
              </button>
            </div>
          ) : quizInfo?.reussi && !resultat ? (
            /* Quiz déjà validé avec succès */
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
              <span className="text-3xl">🎉</span>
              <h2 className="text-lg font-bold text-emerald-800 mt-2">Évaluation validée !</h2>
              <p className="text-emerald-700 mt-1">Vous avez brillamment validé ce quiz avec {quizInfo?.score}% de réussite.</p>
              <button type="button" onClick={() => router.back()} className="mt-4 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition">
                Passer au chapitre suivant
              </button>
            </div>
          ) : resultat ? (
            /* Résultat de la soumission en cours */
            <div className="space-y-6">
              <div className={`p-6 rounded-xl border text-center ${resultat.reussi ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
                <span className="text-4xl">{resultat.reussi ? "🏆" : "📖"}</span>
                <h2 className={`text-xl font-bold mt-2 ${resultat.reussi ? "text-emerald-800" : "text-amber-800"}`}>
                  Résultat : {resultat.score}%
                </h2>
                <p className={`mt-2 text-sm max-w-lg mx-auto ${resultat.reussi ? "text-emerald-700" : "text-amber-700"}`}>
                  {resultat.message}
                </p>
                <div className="mt-4 flex justify-center gap-4">
                  {resultat.reussi ? (
                    <button type="button" onClick={() => router.back()} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition">
                      Continuer le cours
                    </button>
                  ) : (
                    <>
                      {!resultat.bloque && (
                        <button type="button" onClick={() => { setResultat(null); setReponses({}); }} className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition">
                          Nouvelle tentative
                        </button>
                      )}
                      <button type="button" onClick={() => router.back()} className="px-5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition">
                        Fermer
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Correction sommaire des questions */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 font-mono">Détail des questions</h3>
                <div className="space-y-3">
                  {resultat.detail?.map((det, index) => (
                    <div key={index} className={`p-4 rounded-lg border flex justify-between items-center ${det.correct ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" : "bg-red-50/50 border-red-100 text-red-800"}`}>
                      <span className="font-medium text-sm">Question N°{index + 1}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${det.correct ? "bg-emerald-200/50 text-emerald-800" : "bg-red-200/50 text-red-800"}`}>
                        {det.correct ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Formulaire interactif des questions */
            <form onSubmit={handleSubmit} className="space-y-8">
              {quizInfo?.questions?.map((q, idx) => (
                <div key={q.id} className="p-5 border border-gray-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition duration-150">
                  <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full mb-3">
                    Question {idx + 1} • {q.points ||