import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function PretestPage() {
  const router = useRouter();
  const { id, courseId } = router.query;

  const [pretest, setPretest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!router.isReady || !id) return;

    const fetchPretest = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/pretest/${id}`, { credentials: "include" });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "الاختبار التمهيدي غير موجود");
          return;
        }

        setPretest(data);
        setAnswers({});
      } catch (err) {
        setError("خطأ في الخادم");
      } finally {
        setLoading(false);
      }
    };

    fetchPretest();
  }, [router.isReady, id]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== pretest.questions.length) {
      setError("أجب على جميع الأسئلة!");
      return;
    }

    setSubmitted(true);
    setError("");

    try {
      const res = await fetch(`/api/pretest/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          answers,
          courseId: parseInt(courseId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطأ في الإرسال");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("خطأ في الخادم");
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < pretest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) return <p dir="rtl" lang="ar">جارٍ تحميل الاختبار التمهيدي...</p>;
  if (error && !submitted) return <p dir="rtl" lang="ar" style={{ color: "red" }}>{error}</p>;
  if (!pretest) return <p dir="rtl" lang="ar">الاختبار التمهيدي غير موجود</p>;

  if (submitted && result) {
    return (
      <div dir="rtl" lang="ar" style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
        <div style={{
          padding: "2rem",
          borderRadius: "10px",
          background: result.feedback.color,
          color: "white",
          textAlign: "center",
        }}>
          <h1>📊 النتيجة: {result.score}/{result.total}</h1>
          <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>
            {((result.score / result.total) * 100).toFixed(0)}%
          </p>
          <h2 style={{ marginTop: "1.5rem" }}>{result.feedback.message}</h2>

          {result.feedback.suggestedCourseYear && (
            <div style={{ marginTop: "2rem", padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
              <p>📚 نوصيك بمتابعة دورة <strong>{result.feedback.suggestedCourseYear}</strong> أولًا</p>
            </div>
          )}
        </div>

        <button
            onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
          style={{
            marginTop: "2rem",
            padding: "0.75rem 1.5rem",
            background: "#059669",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            width: "100%",
          }}
        >
          ✅ متابعة إلى الدورة
        </button>
      </div>
    );
  }

  const currentQuestion = pretest.questions[currentQuestionIndex];
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const progressPercent = ((currentQuestionIndex + 1) / pretest.questions.length) * 100;

  return (
    <div dir="rtl" lang="ar" style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
          السؤال {currentQuestionIndex + 1} / {pretest.questions.length}
        </div>
        <div style={{
          width: "100%",
          height: "8px",
          background: "#e5e7eb",
          borderRadius: "10px",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: "#059669",
            transition: "width 0.3s",
          }} />
        </div>
      </div>

      <div style={{
        padding: "2rem",
        background: "#f9fafb",
        borderRadius: "10px",
        marginBottom: "2rem",
      }}>
        <h2>{currentQuestion.texte}</h2>

        <div style={{ marginTop: "1.5rem" }}>
          {currentQuestion.type === "VRAI_FAUX" ? (
            <div style={{ display: "flex", gap: "1rem" }}>
              {["صحيح", "خاطئ"].map(choice => (
                <button
                  key={choice}
                  onClick={() => handleAnswer(currentQuestion.id, choice)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: answers[currentQuestion.id] === choice ? "#059669" : "#e5e7eb",
                    color: answers[currentQuestion.id] === choice ? "white" : "black",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {currentQuestion.choix.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(currentQuestion.id, choice)}
                  style={{
                    padding: "0.75rem 1rem",
                    background: answers[currentQuestion.id] === choice ? "#059669" : "#e5e7eb",
                    color: answers[currentQuestion.id] === choice ? "white" : "black",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "right",
                    fontWeight: answers[currentQuestion.id] === choice ? "600" : "400",
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          padding: "1rem",
          background: "#fee2e2",
          color: "#991b1b",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between" }}>
        <button
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          style={{
            padding: "0.75rem 1.5rem",
            background: currentQuestionIndex === 0 ? "#ccc" : "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer",
            fontWeight: "600",
          }}
        >
          → السابق
        </button>

        {currentQuestionIndex === pretest.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={!isAnswered}
            style={{
              padding: "0.75rem 1.5rem",
              background: !isAnswered ? "#ccc" : "#059669",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: !isAnswered ? "not-allowed" : "pointer",
              fontWeight: "600",
            }}
          >
            ✅ إرسال
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!isAnswered}
            style={{
              padding: "0.75rem 1.5rem",
              background: !isAnswered ? "#ccc" : "#059669",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: !isAnswered ? "not-allowed" : "pointer",
              fontWeight: "600",
            }}
          >
            ← التالي
          </button>
        )}
      </div>
    </div>
  );
}
