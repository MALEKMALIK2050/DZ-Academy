import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  ChevronRight,
  FileText,
  Clock,
  Award,
  BookOpen
} from "lucide-react";

export default function StudentQuizPage() {
  const router = useRouter();
  const { id: quizId } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Charger le quiz de manière sécurisée en récupérant l'ID de la requête
  useEffect(() => {
    if (!quizId) return;

    async function loadQuiz() {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/quiz?quizId=${quizId}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erreur de chargement du quiz");
        }
        const data = await res.json();
        setQuizInfo(data);
      } catch (err) {
        console.error("Erreur quiz:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId]);

  // Gérer le changement de valeur pour QCM/Vrai Faux
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Gérer les options multiples cochées
  const handleCheckboxChange = (questionId, option, checked) => {
    const currentAnswers = answers[questionId] || [];
    let updated;
    if (checked) {
      updated = [...currentAnswers, option];
    } else {
      updated = currentAnswers.filter(item => item !== option);
    }
    handleAnswerChange(questionId, updated);
  };

  // Soumettre les réponses vers l'API sécurisée
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quizId) return;

    const unanswered = quizInfo.quiz.questions.filter(
      q => answers[q.id] === undefined || answers[q.id] === "" || (Array.isArray(answers[q.id]) && answers[q.id].length === 0)
    );

    if (unanswered.length > 0) {
      if (!confirm(`Il vous reste ${unanswered.length} question(s) sans réponse. Souhaitez-vous soumettre ?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/student/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: parseInt(quizId),
          answers
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la soumission");
      }

      const data = await res.json();
      setResult(data);
      setSubmitted(true);
      
      // Mettre à jour l'info du quiz localement
      setQuizInfo(prev => ({
        ...prev,
        attemptsCount: data.attemptsCount,
        bestScore: Math.max(prev.bestScore || 0, data.score),
        dejaReussi: prev.dejaReussi || data.reussi
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Recommencer une tentative
  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement sécurisé de vos questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Impossible d'accéder au Quiz</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => router.back()} 
            className="w-full py-2.5 px-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition"
          >
            Retourner au cours
          </button>
        </div>
      </div>
    );
  }

  const { quiz, attemptsCount, maxAttempts, seuilReussite, bestScore, dejaReussi } = quizInfo;
  const limitsExceeded = attemptsCount >= maxAttempts;

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className={`p-8 text-center text-white ${result.reussi ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              {result.reussi ? "Validation Réussie" : "En cours d'assimilation"}
            </span>
            <h1 className="text-4xl font-extrabold mb-1">{result.score}%</h1>
            <p className="text-white/80 text-sm">
              Score requis pour valider : {result.seuil}% • Tentative #{result.attemptsCount}
            </p>
          </div>

          <div className="p-8">
            {result.reussi ? (
              <div className="p-5 bg-emerald-50 border border-emerald-250 rounded-2xl text-emerald-900 flex gap-4 items-start mb-8">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-950">Félicitations !</h3>
                  <p className="text-sm mt-1 text-emerald-800">
                    Vous avez obtenu un score de {result.score}%, dépassant le seuil de {result.seuil}%. Ce chapitre est validé !
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex gap-4 items-start mb-8">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-rose-950">Seuil non atteint</h3>
                  <p className="text-sm mt-1 text-rose-800">
                    Vous avez obtenu {result.score}%. Il est conseillé de relire le cours de ce chapitre pour mieux retenir les points essentiels.
                  </p>
                  {result.attemptsCount < result.maxAttempts ? (
                    <p className="text-xs font-semibold text-rose-900 mt-2">
                      Il vous reste {result.maxAttempts - result.attemptsCount} essai(s) sur {result.maxAttempts}.
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-rose-250 mt-2">
                      Vous avez consommé vos {result.maxAttempts} essais autorisés.
                    </p>
                  )}
                </div>
              </div>
            )}

            <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />Correction Détaillée
            </h2>

            <div className="space-y-6">
              {quiz.questions.map((q, idx) => {
                const stepResult = result.details.find(d => d.questionId === q.id);
                const answerIsCorrect = stepResult?.isCorrect;
                return (
                  <div key={q.id} className={`p-5 rounded-2xl border ${answerIsCorrect ? 'bg-emerald-50/20 border-emerald-100' : 'bg-rose-50/20 border-rose-105'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-800 text-sm">Question {idx + 1} ({q.points || 1} pt)</span>
                      {answerIsCorrect ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Correct</span>
                      ) : (
                        <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">Erreur</span>
                      )}
                    </div>
                    <p className="text-slate-900 font-medium mb-3">{q.questionText}</p>
                    <div className="text-sm space-y-1">
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-700">Votre réponse :</span>{" "}
                        {Array.isArray(stepResult?.userAnswer) ? stepResult.userAnswer.join(", ") : String(stepResult?.userAnswer || "(aucune)")}
                      </p>
                      {!answerIsCorrect && q.reponseCorrecte && (
                        <p className="text-emerald-750 font-medium">
                          <span className="font-medium text-slate-700 font-normal text-slate-600">Réponse correcte :</span>{" "}
                          {Array.isArray(q.reponseCorrecte) ? q.reponseCorrecte.join(", ") : String(q.reponseCorrecte)}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                          💡 Explication : {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-4">
              <Link 
                href="/dashboard/student"
                className="py-3 px-6 bg-slate-100 text-slate-700 font-semibold rounded-xl text-center hover:bg-slate-200 transition text-sm flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Retour aux chapitres
              </Link>
              {!result.reussi && result.attemptsCount < result.maxAttempts && (
                <button 
                  onClick={handleRetry}
                  className="py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition text-sm flex justify-center items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Réessayer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (limitsExceeded && !dejaReussi) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-650 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Tentatives Épuisées (Bloqué)</h1>
          <p className="text-slate-600 text-sm mb-6">
            Vous avez effectué vos {attemptsCount} tentatives autorisées sans valider le seuil de réussite de {seuilReussite}%. 
            Veuillez entrer en contact avec l'enseignant pour lever ce blocage.
          </p>
          <Link 
            href="/dashboard/student"
            className="inline-block py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
          >
            Retourner aux chapitres
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-150 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Examen de Chapitre
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{quiz ? quiz.title : "Validation de compétence"}</h1>
              <p className="text-slate-500 text-sm mt-1">Lisez attentivement chaque question avant de choisir.</p>
            </div>
            <div className="shrink-0 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex gap-4 md:flex-col text-xs text-slate-600 justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Essais : {attemptsCount} / {maxAttempts === Infinity ? "Illimités" : maxAttempts}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-400" />
                <span>Score requis : {seuilReussite}%</span>
              </div>
              {bestScore !== null && (
                <div className="flex items-center gap-2 font-bold text-indigo-600">
                  <CheckCircle className="w-4 h-4 text-indigo-505" />
                  <span>Meilleur : {bestScore}% {dejaReussi && "✅"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {quiz && quiz.questions ? quiz.questions.map((q, idx) => {
            const currentVal = answers[q.id];
            return (
              <div key={q.id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="flex items-start gap-4 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-snug">{q.questionText}</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                      Type : {q.type === "QCM" ? "Choix unique" : q.type === "QCM_MULTIPLE" ? "Choix multiple" : "Vrai ou Faux"} • {q.points || 1} pt(s)
                    </p>
                  </div>
                </div>

                <div className="pl-0 md:pl-12 mt-4 grid grid-cols-1 gap-3">
                  {q.type === "QCM" && q.options && (typeof q.options === "string" ? JSON.parse(q.options) : q.options).map((option, oIdx) => (
                    <label key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${currentVal === option ? 'border-indigo-500 bg-indigo-50/20 font-medium' : 'border-slate-150 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name={`sim-q-${q.id}`} 
                        checked={currentVal === option} 
                        onChange={() => handleAnswerChange(q.id, option)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-slate-800 text-sm">{option}</span>
                    </label>
                  ))}

                  {q.type === "QCM_MULTIPLE" && q.options && (typeof q.options === "string" ? JSON.parse(q.options) : q.options).map((option, oIdx) => {
                    const isChecked = (currentVal || []).includes(option);
                    return (
                      <label key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${isChecked ? 'border-indigo-500 bg-indigo-50/20 font-medium' : 'border-slate-150 hover:bg-slate-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => handleCheckboxChange(q.id, option, e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-slate-800 text-sm">{option}</span>
                      </label>
                    );
                  })}

                  {q.type === "VRAI_FAUX" && (
                    <div className="grid grid-cols-2 gap-4">
                      {["Vrai", "Faux"].map((choice) => (
                        <button
                          type="button"
                          key={choice}
                          onClick={() => handleAnswerChange(q.id, choice)}
                          className={`py-4 px-6 rounded-xl border text-center font-semibold text-sm transition ${currentVal === choice ? 'bg-indigo-600 text-white border-indigo-605' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }) : null}

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-400">Toutes les réponses sont obligatoires</span>
            <button
              type="submit"
              disabled={submitting}
              className="py-3 px-8 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Soumettre mes réponses
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}