import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function StudentQuizPage() {
  const router = useRouter();
  const { quizId } = router.query;

  const [quizInfo, setQuizInfo] = useState(null);
  const [reponses, setReponses] = useState({});
  const [tentativeState, setTentativeState] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!quizId) return;

    // Charger les informations et l'état des tentatives du quiz
    Promise.all([
      fetch(`/api/student/quiz?quizId=${quizId}`).then((res) => res.json()),
      fetch(`/api/quiz/${quizId}`).then((res) => (res.ok ? res.json() : { title: "Évaluation", questions: [] }))
    ])
      .then(([statusData, quizData]) => {
        setTentativeState(statusData);
        setQuizInfo(quizData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur lors de la récupération des données du quiz.");
        setLoading(false);
      });
  }, [quizId]);

  const handleReponseChange = (questionId, value) => {
    setReponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const submitQuiz = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");
    setFeedback(null);

    try {
      const response = await fetch("/api/student/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, reponses }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue lors de la soumission.");
      }

      setFeedback(result);
      setTentativeState({
        tentatives: result.tentatives,
        maxTentatives: result.tentatives + result.tentativesRestantes,
        score: result.score,
        reussi: result.reussi,
        bloque: result.bloque,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-3">{quizInfo?.title || "Quiz Évaluation"}</h1>
        <p className="text-slate-500 mb-6">Testez vos connaissances et valisez ce chapitre.</p>

        {/* Bloc Tentatives et Statistiques */}
        {tentativeState && (
          <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-500 font-medium">Tentatives :</div>
              <div className="text-xl font-bold text-slate-800">
                {tentativeState.tentatives} / {tentativeState.maxTentatives === Infinity ? "Illimitées" : tentativeState.maxTentatives}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 font-medium">Dernier Score :</div>
              <div className="text-xl font-bold text-slate-800">
                {tentativeState.score !== null ? `${tentativeState.score}%` : "Aucun"}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 font-medium">Statut :</div>
              <div className="text-xl font-bold">
                {tentativeState.reussi ? (
                  <span className="text-emerald-600">✅ Réussi</span>
                ) : tentativeState.bloque ? (
                  <span className="text-rose-600">❌ Bloqué</span>
                ) : (
                  <span className="text-amber-500">⚙️ En cours</span>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Message de Feedback de soumission */}
        {feedback && (
          <div className={`p-6 rounded-xl border mb-8 ${feedback.reussi ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-805'}`}>
            <h3 className="font-bold text-lg mb-2">{feedback.message}</h3>
            {feedback.score !== undefined && (
              <p className="text-sm font-medium">
                Score obtenu : <span className="font-bold">{feedback.score}%</span> ({feedback.correct} réponses correctes sur {feedback.total} points)
              </p>
            )}
          </div>
        )}

        {tentativeState?.bloque ? (
          <div className="text-center py-6">
            <p className="text-rose-600 font-semibold mb-4">Vous avez atteint le nombre maximum de tentatives pour ce quiz.</p>
            <p className="text-slate-500">Veuillez contacter votre professeur pour initier une remédiation d'accompagnement.</p>
          </div>
        ) : (
          <form onSubmit={submitQuiz}>
            <div className="space-y-8">
              {quizInfo?.questions?.map((q, idx) => (
                <div key={q.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition duration-150">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full">
                      Question {idx + 1}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      ({q.points || 1} {q.points > 1 ? "points" : "point"})
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">{q.enonce}</h3>

                  {q.type === "QCM" && (
                    <div className="space-y-2">
                      {JSON.parse(q.options || "[]").map((option) => (
                        <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer transition">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={option}
                            checked={reponses[q.id] === option}
                            onChange={(e) => handleReponseChange(q.id, e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            disabled={tentativeState?.reussi}
                          />
                          <span className="text-sm text-slate-700 font-medium">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "VRAI_FAUX" && (
                    <div className="flex gap-4">
                      {["Vrai", "Faux"].map((val) => (
                        <label key={val} className="flex-1 flex items-center justify-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer transition">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={val}
                            checked={reponses[q.id] === val}
                            onChange={(e) => handleReponseChange(q.id, e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            disabled={tentativeState?.reussi}
                          />
                          <span className="text-sm font-semibold text-slate-700">{val}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "OUVERTE" && (
                    <textarea
                      rows={3}
                      value={reponses[q.id] || ""}
                      onChange={(e) => handleReponseChange(q.id, e.target.value)}
                      placeholder="Saisissez votre réponse ici..."
                      className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      disabled={tentativeState?.reussi}
                    />
                  )}
                </div>
              ))}
            </div>

            {!tentativeState?.reussi && (
              <button
                type="submit"
                disabled={submitting}
                className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-md transition duration-150 disabled:opacity-50"
              >
                {submitting ? "Soumission en cours..." : "Soumettre le Quiz"}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}