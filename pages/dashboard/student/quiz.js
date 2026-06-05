import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function StudentQuizPage() {
  const router = useRouter();
  const { quizId } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [reponses, setReponses] = useState({});
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);

  // Charger le quiz uniquement si le component est monté
  useEffect(() => {
    if (!quizId) return;

    setIsLoading(true);
    setErreur("");

    fetch(`/api/student/quiz?quizId=${quizId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de récupérer les informations du quiz");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        setErreur(err.message);
        setIsLoading(false);
      });
  }, [quizId]);

  // Gérer la saisie ou sélection de réponse de l'élève
  const handleReponseChange = (questionId, valeur) => {
    setReponses((prev) => ({
      ...prev,
      [questionId]: valeur,
    }));
  };

  const soumettreQuiz = async (e) => {
    e.preventDefault();
    if (!quizId) return;

    setSoumissionEnCours(true);
    setErreur("");
    setResultat(null);

    try {
      const response = await fetch("/api/student/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, reponses }),
      });

      const resultData = await response.json();
      if (!response.ok) {
        throw new Error(resultData.error || "Une erreur est survenue.");
      }

      setResultat(resultData);
      
      // Mettre à jour localement l'historique
      setData((prev) => ({
        ...prev,
        tentatives: resultData.tentatives,
        score: resultData.score,
        reussi: resultData.reussi,
        bloque: resultData.bloque,
      }));
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSoumissionEnCours(false);
    }
  };

  if (!quizId) {
    return (
      <div className="p-8 text-center bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow border border-slate-100 max-w-sm">
          <p className="text-gray-500 mb-4">Aucun identifiant de quiz spécifié.</p>
          <button 
            onClick={() => router.push("/dashboard/student/courses")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
          >
            Retour aux cours
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Chargement du quiz en cours...</p>
        </div>
      </div>
    );
  }

  const quizInfo = data?.quiz;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Header du Quiz */}
        <div className="bg-indigo-900 px-6 py-8 text-white">
          <button 
            onClick={() => router.push("/dashboard/student/courses")}
            className="text-xs text-indigo-200 hover:text-white transition uppercase font-bold tracking-wider mb-3 block"
          >
            ← Retour à mes cours
          </button>
          <h1 className="text-2xl font-bold">{quizInfo?.title || "Quiz interactif"}</h1>
          <p className="text-sm text-indigo-200 mt-2">
            Seuil de réussite requis : 90% • Tentatives effectuées : {data?.tentatives || 0}/{data?.maxTentatives}
          </p>
        </div>

        {/* Corps principal */}
        <div className="p-6 md:p-8">
          {erreur && (
            <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
              ⚠️ {erreur}
            </div>
          )}

          {/* Déjà réussi ou bloqué */}
          {data?.reussi && (
            <div className="p-6 mb-8 bg-green-50 text-green-800 rounded-xl border border-green-100 text-center">
              <h3 className="text-lg font-bold mb-1">🎉 Quiz réussi !</h3>
              <p className="text-sm font-medium">Vous avez obtenu {data?.score}% et validé cette étape.</p>
            </div>
          )}

          {data?.bloque && (
            <div className="p-6 mb-8 bg-red-50 text-red-800 rounded-xl border border-red-100 text-center">
              <h3 className="text-lg font-bold mb-2">⛔ Tentatives épuisées</h3>
              <p className="text-sm">Votre accès à ce quiz est bloqué. Veuillez contacter votre coordinateur pédagogique.</p>
            </div>
          )}

          {/* Résultats de la soumission récente */}
          {resultat && (
            <div className={`p-6 mb-8 rounded-xl border text-center ${resultat.reussi ? 'bg-green-50 border-green-200 text-green-900' : 'bg-orange-50 border-orange-200 text-orange-900'}`}>
              <h3 className="text-xl font-bold mb-3">{resultat.reussi ? 'Bravo !' : 'Essayez encore'}</h3>
              <p className="text-3xl font-extrabold mb-2">{resultat.score}%</p>
              <p className="text-sm font-medium mb-4">{resultat.message}</p>
              <div className="text-xs text-slate-500">
                Score : {resultat.correct} / {resultat.total} points
              </div>
            </div>
          )}

          {/* Formulaire contenant les questions */}
          {!data?.reussi && !data?.bloque && quizInfo?.questions && (
            <form onSubmit={soumettreQuiz} className="space-y-8">
              {quizInfo.questions.map((q, idx) => (
                <div key={q.id} className="p-6 border border-slate-100 rounded-xl bg-slate-50/50">
                  <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full mb-3">
                    Question {idx + 1} ({q.points || 1} point{q.points > 1 ? 's' : ''})
                  </span>
                  <p className="text-base font-semibold text-slate-900 mb-4">{q.question}</p>

                  {/* QCM / VRAI-FAUX */}
                  {(q.type === "QCM" || q.type === "VRAI_FAUX") && q.options && (
                    <div className="space-y-2">
                      {(typeof q.options === "string" ? JSON.parse(q.options) : q.options).map((opt) => (
                        <label key={opt} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/50 transition">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={reponses[q.id] === opt}
                            onChange={() => handleReponseChange(q.id, opt)}
                            required
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-slate-755">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* OUVERTE */}
                  {q.type === "OUVERTE" && (
                    <input
                      type="text"
                      placeholder="Votre réponse ici..."
                      value={reponses[q.id] || ""}
                      onChange={(e) => handleReponseChange(q.id, e.target.value)}
                      required
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white"
                    />
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={soumissionEnCours}
                  className={`w-full py-4 rounded-xl text-white font-bold text-base transition ${soumissionEnCours ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
                >
                  {soumissionEnCours ? "Vérification en cours..." : "Soumettre mes réponses"}
                </button>
              </div>
            </form>
          )}

          {/* Statut si déjà soumis mais non réussi, tentatives restantes */}
          {!data?.reussi && !data?.bloque && data?.tentatives > 0 && !resultat && (
            <div className="mt-8 p-4 bg-slate-100/80 rounded-xl text-center text-sm text-slate-600 font-medium">
              Note précédente : {data?.score}% (Seuil requis : 90%)
            </div>
          )}

        </div>
      </div>
    </div>
  );
}