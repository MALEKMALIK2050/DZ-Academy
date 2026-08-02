import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

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

  useEffect(() => {
    if (!quizId) return;

    async function loadQuiz() {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/quiz?quizId=${quizId}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "تعذّر تحميل الاختبار...");
        }
        const data = await res.json();
        setQuizInfo(data);
      } catch (err) {
        console.error("Erreur chargement quiz:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId, option, checked) => {
    const current = answers[questionId] || [];
    let updated;
    if (checked) {
      updated = [...current, option];
    } else {
      updated = current.filter(item => item !== option);
    }
    handleAnswerChange(questionId, updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quizId) return;

    const unanswered = quizInfo.quiz.questions.filter(q => answers[q.id] === undefined || answers[q.id] === "");
    if (unanswered.length > 0 && !confirm(`بقي ${unanswered.length} سؤال (أسئلة) بدون إجابة. هل تريد المتابعة؟`)) {
      return;
    }

    setSubmitting(true);
    try {
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
        throw new Error(errData.error || "فشل تسجيل إجاباتك.");
      }

      const data = await res.json();
      setResult(data);
      setSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" lang="ar" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="text-indigo-600 font-bold mb-4">جارٍ تحميل الاختبار...</div>
        <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full animate-ping" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" lang="ar" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="p-6 bg-white border border-red-200 rounded-3xl max-w-md shadow-sm text-center">
          <div className="text-red-500 font-bold mb-2">خطأ جسيم</div>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button onClick={() => router.back()} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold transition">
            العودة إلى الوراء
          </button>
        </div>
      </div>
    );
  }

  const { quiz, attemptsCount, maxAttempts, seuilReussite, bestScore, dejaReussi } = quizInfo;

  if (submitted && result) {
    return (
      <div dir="rtl" lang="ar" className="min-h-screen bg-slate-50 py-12 px-4 text-slate-800">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <div className="text-center mb-8">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${result.reussi ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
              {result.reussi ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-black">{result.reussi ? "تهانينا، تم القبول!" : "النتيجة غير كافية"}</h1>
            <p className="text-slate-500 text-xs mt-1">لقد حصلت على نتيجة {result.score}% (النسبة المطلوبة: {result.seuil}%)</p>
          </div>

          <div className="space-y-4 mb-8">
            {result.details?.map((det, index) => {
              const qOriginal = quiz.questions.find(q => q.id === det.questionId);
              return (
                <div key={det.questionId} className={`p-4 rounded-2xl border ${det.isCorrect ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"}`}>
                  <p className="font-bold text-sm text-slate-800 mb-1">السؤال {index + 1}: {qOriginal?.questionText}</p>
                  <p className="text-xs">
                    إجابتك: <strong className="text-slate-900">{Array.isArray(det.userAnswer) ? det.userAnswer.join("، ") : String(det.userAnswer || "فارغة")}</strong>
                  </p>
                  {!det.isCorrect && qOriginal?.explanation && (
                    <p className="text-xs text-indigo-700 font-medium mt-2 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/30">
                      💡 شرح: {qOriginal.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <button onClick={() => router.reload()} className="flex-1 py-3 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
              إعادة محاولة الاختبار
            </button>
            <Link href="/dashboard/student/courses" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center">
              المتابعة إلى الكتالوج
            </ Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-slate-50 py-12 px-4 text-slate-800">
      <div className="max-w-3xl mx-auto">
        <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm mb-6">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            تقييم تكويني
          </span>
          <h1 className="text-2xl font-black mt-2 text-slate-900">{quiz.title}</h1>
          <p className="text-slate-500 text-xs mt-1">العدد الأقصى للمحاولات: {maxAttempts === Infinity ? "غير محدود" : maxAttempts}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {quiz.questions?.map((q, idx) => (
            <div key={q.id} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-wider">
                السؤال {idx + 1}
              </span>
              <p className="font-bold text-slate-800 text-md">{q.questionText}</p>

              {q.type === "QCM" && q.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {JSON.parse(q.options || "[]").map((opt) => (
                    <label key={opt} className={`p-4 border rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition ${answers[q.id] === opt ? "border-indigo-600 bg-indigo-50/20" : "border-slate-200"}`}>
                      <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => handleAnswerChange(q.id, opt)} className="text-indigo-600 mr-2" />
                      <span className="text-xs font-medium text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "VRAI_FAUX" && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {["صحيح", "خاطئ"].map((opt) => (
                    <label key={opt} className={`p-4 border rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition ${answers[q.id] === opt ? "border-indigo-600 bg-indigo-50/20" : "border-slate-200"}`}>
                      <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => handleAnswerChange(q.id, opt)} className="text-indigo-600 mr-2" />
                      <span className="text-xs font-bold text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "OUVERTE" && (
                <input type="text" value={answers[q.id] || ""} onChange={(e) => handleAnswerChange(q.id, e.target.value)} placeholder="اكتب إجابتك هنا..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600" />
              )}
            </div>
          ))}

          <button type="submit" disabled={submitting} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2">
            {submitting ? "جارٍ الإرسال..." : "إرسال الإجابات"}
          </button>
        </form>
      </div>
    </div>
  );
}
