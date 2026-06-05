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

  // Charger les données dynamiquement depuis l'API sécurisée au montage
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
        console.error("Erreur de récupération du Quiz :", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quizId) return;

    const unanswered = quizInfo.quiz.questions.filter(
      q => answers[q.id] === undefined || answers[q.id] === "" || (Array.isArray(answers[q.id]) && answers[q.id].length === 0)
    );

    if (unanswered.length > 0) {
      if (!confirm(`Il vous reste ${unanswered.length} question(s) non répondue(s). Voulez-vous soumettre ?`)) {
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
        throw new Error(errData.error || "Erreur de soumission");
      }

      const data = await res.json();
      setResult(data);
      setSubmitted(true);
      
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
          <p className="text-slate-600 font-medium font-sans">Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-650">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Accès Impossible</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => router.back()} 
            className="w-full py-2.5 px-4 bg-slate-950 text-white font-semibold rounded-xl hover:bg-slate-800 transition"
          >
            Retour
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
          <div className={`p-8 text-center text-white ${result.reussi ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              {result.reussi ? "Validation Réussie !" : "Assimilation incomplète"}
            </span>
            <h1 className="text-4xl font-black mb-1">{result.score}%</h1>
            <p className="text-white/80 text-xs">
              Seuil requis : {result.seuil}% • Tentative #{result.attemptsCount}
            </p>
          </div>

          <div className="p-8">
            {result.reussi ? (
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-4 items-start mb-8">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-950">Validé !</h3>
                  <p className="text-sm text-emerald-800 mt-1">
                    Félicitations, vous avez validé ce module avec succès !
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex gap-4 items-start mb-8">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-rose-950 font-sans">Seuil non atteint</h3>
                  <p className="text-sm text-rose-800 mt-1">
                    Vous n'avez pas atteint le seuil requis de {result.seuil}%. Relisez vos leçons avant de réessayer.
                  </p>
                </div>
              </div>
            )}

            <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> Correction détaillée
            </h2>

            <div className="space-y-6">
              {quiz.questions.map((q, idx) => {
                const stepResult = result.details.find(d => d.questionId === q.id);
                const answerIsCorrect = stepResult?.isCorrect;
                return (
                  <div key={q.id} className={`p-5 rounded-2xl border ${answerIsCorrect ? 'bg-emerald-50/20 border-emerald-100' : 'bg-rose-50/20 border-rose-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xs text-slate-500">Question {idx + 1} ({q.points || 1} pt)</span>
                      {answerIsCorrect ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">Correct</span>
                      ) : (
                        <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">Incorrect</span>
                      )}
                    </div>
                    <p className="text-slate-900 font-semibold mb-3">{q.questionText}</p>
                    <div className="text-sm space-y-1">
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-700">Votre réponse :</span>{" "}
                        {Array.isArray(stepResult?.userAnswer) ? stepResult.userAnswer.join(", ") : String(stepResult?.userAnswer || "(vide)")}
                      </p>
                      {!answerIsCorrect && q.reponseCorrecte && (
                        <p className="text-emerald-700 font-medium">
                          <span className="font-medium text-slate-600">Réponse attendue :</span>{" "}
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

            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between gap-4">
              <Link 
                href="/dashboard/student"
                className="py-3 px-6 bg-slate-100 text-slate-750 font-semibold rounded-xl text-center hover:bg-slate-200 transition text-sm flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Retour aux cours
              </Link>
              {!result.reussi && result.attemptsCount < result.maxAttempts && (
                <button 
                  onClick={handleRetry}
                  className="py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition text-sm flex justify-center items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Nouvelle tentative
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
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Tentatives Épuisées</h1>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Vous avez atteint votre limite de {attemptsCount} tentatives autorisées sans valider le seuil de réussite de {seuilReussite}%. 
            Veuillez vous rapprocher de l'un de vos formateurs.
          </p>
          <Link 
            href="/dashboard/student"
            className="inline-block py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
          >
            Retour au menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Module de validation
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{quiz ? quiz.title : "Validation de compétence"}</h1>
              <p className="text-slate-500 text-sm mt-1">Lisez attentivement l'énoncé de chaque question avant de choisir.</p>
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
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  <span>Meilleur : {bestScore}% {dejaReussi && "✅"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {quiz?.questions?.map((q, idx) => {
            const currentVal = answers[q.id];
            return (
              <div key={q.id} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-705 font-bold text-sm shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-snug">{q.questionText}</h3>
                    <p className="text-xs text-slate-450 mt-1 uppercase tracking-wider font-semibold">
                      {q.type === "QCM" ? "Choix unique" : q.type === "QCM_MULTIPLE" ? "Choix multiple" : "Vrai ou Faux"} • {q.points || 1} pt(s)
                    </p>
                  </div>
                </div>

                <div className="pl-0 md:pl-12 mt-4 grid grid-cols-1 gap-3">
                  {q.type === "QCM" && q.options && (typeof q.options === "string" ? JSON.parse(q.options) : q.options).map((option, oIdx) => (
                    <label key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${currentVal === option ? 'border-indigo-500 bg-indigo-50/20 font-medium' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name={`sim-q-${q.id}`} 
                        checked={currentVal === option} 
                        onChange={() => handleAnswerChange(q.id, option)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-slate-800 text-sm font-sans">{option}</span>
                    </label>
                  ))}

                  {q.type === "QCM_MULTIPLE" && q.options && (typeof q.options === "string" ? JSON.parse(q.options) : q.options).map((option, oIdx) => {
                    const isChecked = (currentVal || []).includes(option);
                    return (
                      <label key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${isChecked ? 'border-indigo-500 bg-indigo-50/20 font-medium' : 'border-slate-100 hover:bg-slate-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => handleCheckboxChange(q.id, option, e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-slate-800 text-sm font-sans">{option}</span>
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
                          className={`py-4 px-6 rounded-xl border text-center font-bold text-sm transition ${currentVal === choice ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex justify-between items-center">
            <span className="text-xs text-slate-400 font-sans">Répondez à toutes les questions avant de valider.</span>
            <button
              type="submit"
              disabled={submitting}
              className="py-3 px-8 bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Exécuter la correction
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}