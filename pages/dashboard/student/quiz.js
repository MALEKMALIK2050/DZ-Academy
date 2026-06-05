// pages/dashboard/student/quiz.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function StudentQuizPage() {
  const router = useRouter();
  const { quizId } = router.query;

  const [status, setStatus] = useState(null);
  const [reponses, setReponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quizId) return;

    fetch(`/api/student/quiz?quizId=${quizId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur de chargement du statut");
        return res.json();
      })
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [quizId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    fetch("/api/student/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, reponses }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFeedback(data);
        // Actualise le statut des tentatives en tâche de fond
        return fetch(`/api/student/quiz?quizId=${quizId}`);
      })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setSubmitting(false);
      })
      .catch((err) => {
        setError(err.message);
        setSubmitting(false);
      });
  };

  if (!quizId) {
    return (
      <div className="p-8 text-center text-gray-500 font-sans">
        Identifiant du quiz manquant ou invalide.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold border-b pb-4 mb-6 text-gray-800">Candidature au Quiz</h1>

      {loading && <p className="text-gray-500">Chargement des informations du quiz...</p>}
      {error && <p className="text-red-500 bg-red-50 p-3 rounded mb-4">{error}</p>}

      {!loading && status && (
        <div className="space-y-6">
          {/* Section Récapitulative / Statut Actuel */}
          <div className="bg-slate-50 border rounded-lg p-5 space-y-2">
            <h2 className="text-lg font-semibold text-gray-700">Votre statut actuel</h2>
            <p className="text-sm text-gray-650">
              Tentatives effectuées : <strong className="text-gray-900">{status.tentatives} / {status.maxTentatives === Infinity ? "Illimité" : status.maxTentatives}</strong>
            </p>
            {status.score !== null && (
              <p className="text-sm">
                Meilleur score obtenu : <strong className="text-gray-900">{status.score}%</strong>
              </p>
            )}
            {status.reussi ? (
              <p className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 font-medium rounded-full text-xs">
                ✓ Quiz Réussi
              </p>
            ) : status.bloque ? (
              <p className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-800 font-medium rounded-full text-xs">
                ✗ Tentatives Épuisées (Accès Verrouillé)
              </p>
            ) : null}
          </div>

          {/* Formulaire de Soumission ou messages d'état spéciaux */}
          {status.bloque ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-lg">
              <h3 className="font-semibold text-base mb-2">Quiz Verrouillé</h3>
              <p className="text-sm">Vous avez épuisé vos tentatives. Veuillez vous rapprocher de votre enseignant pour débloquer votre accès.</p>
            </div>
          ) : status.reussi ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-5 rounded-lg text-center">
              <h3 className="font-bold text-lg mb-1">Félicitations !</h3>
              <p className="text-sm">Vous avez déjà validé ce quiz avec succès. Vous pouvez poursuivre vers l'étape ou le cours suivant.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 border p-6 rounded-lg">
              <p className="text-sm text-gray-500 italic">Veuillez répondre avec soin à chaque question ci-dessous :</p>
              
              {/* Note: Dans les faits, les questions proviennent du quizId. Ce formulaire est un collecteur des réponses */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Saisissez l'ID et vos réponses ci-dessous :</label>
                  <input
                    type="text"
                    placeholder="Réponse principale..."
                    onChange={(e) => setReponses({ ...reponses, default: e.target.value })}
                    className="border rounded px-3 py-2 text-sm max-w-md focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-750 transition-colors disabled:opacity-50"
              >
                {submitting ? "Soumission en cours..." : "Soumettre mes réponses"}
              </button>
            </form>
          )}

          {/* Retour de soumission en temps réel (Feedback) */}
          {feedback && (
            <div className={`p-5 rounded-lg border ${feedback.reussi ? "bg-green-50 border-green-200 text-green-800" : "bg-orange-50 border-orange-200 text-orange-850"}`}>
              <h3 className="font-bold mb-2 text-base">{feedback.reussi ? "Résultat : Validé !" : "Résultat : Non validé"}</h3>
              <p className="text-sm font-bold mb-1">Votre score : {feedback.score}%</p>
              <p className="text-sm text-slate-700">{feedback.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}