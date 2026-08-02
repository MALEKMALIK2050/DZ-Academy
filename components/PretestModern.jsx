import { useState } from "react";

export default function PretestModern({ pretest, course, user, onSubmit, loading }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const question = pretest.questions?.[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / (pretest.questions?.length || 1)) * 100);
  const answered = Object.keys(answers).length;
  const allAnswered = answered === (pretest.questions?.length || 0);

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [question.id]: value });
    
    // Avancer automatiquement après 500ms
    if (currentQuestion < pretest.questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 500);
    }
  };

  const handleNext = () => {
    if (currentQuestion < pretest.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (allAnswered) {
      onSubmit(answers);
    }
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #f0fdf4 0%, #fef2f2 100%)",
      minHeight: "100vh",
      padding: "1rem",
      direction: "rtl"
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
          color: "white",
          padding: "1.25rem 1.5rem",
          borderRadius: "18px",
          marginBottom: "1.75rem",
          boxShadow: "0 10px 30px rgba(5, 150, 105, 0.2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "2.5rem" }}>🎯</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(1.3rem, 4vw, 1.9rem)", fontWeight: "800", fontFamily: "'Amiri', 'Tajawal', serif" }}>
                تقييم المستوى الأولي
              </h1>
              <p style={{ margin: "0.3rem 0 0", opacity: 0.95, fontSize: "0.95rem", fontFamily: "'Tajawal', sans-serif", fontWeight: "500" }}>
                قيّم معارفك ومعلوماتك قبل البدء في هذه الدورة
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            padding: "0.85rem 1.1rem",
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem", fontFamily: "'Reem Kufi', 'Tajawal', sans-serif", fontWeight: "600" }}>
              <span>نسبة التقدم</span>
              <span style={{ fontWeight: "800" }}>{progress}%</span>
            </div>
            <div style={{
              background: "rgba(255, 255, 255, 0.3)",
              borderRadius: "10px",
              height: "10px",
              overflow: "hidden",
            }}>
              <div style={{
                background: "linear-gradient(90deg, #fbbf24 0%, #f97316 100%)",
                width: `${progress}%`,
                height: "100%",
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
          border: "1px solid #e0f2fe",
        }}>

          {/* Question */}
          <div style={{ padding: "clamp(1rem, 4vw, 2.5rem)" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}>
              <div style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "white",
                width: "50px",
                height: "50px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "1.25rem",
                fontFamily: "'Cairo', sans-serif",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
              }}>
                {currentQuestion + 1}
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", color: "#059669", fontWeight: "700", fontFamily: "'Reem Kufi', 'Tajawal', sans-serif" }}>
                  السؤال {currentQuestion + 1} من {pretest.questions?.length}
                </div>
              </div>
            </div>

            <h2 style={{
              margin: "0 0 1.5rem",
              fontSize: "clamp(1.1rem, 3.5vw, 1.45rem)",
              fontWeight: "700",
              color: "#1f2937",
              lineHeight: "1.6",
              fontFamily: "'Amiri', 'Tajawal', serif"
            }}>
              {question?.texte}
            </h2>

            {/* Réponses */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {question?.choix?.map((choix, idx) => {
                const isSelected = answers[question.id] === choix;
                return (
                  <label
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem 1.25rem",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: isSelected
                        ? "linear-gradient(135deg, #f0fdf4 0%, #fef3c7 100%)"
                        : "#f9fafb",
                      border: isSelected
                        ? "2px solid #059669"
                        : "2px solid #e5e7eb",
                      transition: "all 0.2s ease",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={choix}
                      checked={isSelected}
                      onChange={() => handleAnswer(choix)}
                      style={{ display: "none" }}
                    />
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? "#059669" : "#d1d5db"}`,
                      background: isSelected ? "#059669" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      color: "white",
                      fontWeight: "800",
                      flexShrink: 0,
                    }}>
                      {isSelected && "✓"}
                    </div>
                    <span style={{
                      fontSize: "1.05rem",
                      color: isSelected ? "#065F46" : "#374151",
                      fontWeight: isSelected ? "700" : "500",
                      fontFamily: "'Tajawal', 'Cairo', sans-serif"
                    }}>
                      {choix}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Indicateurs de réponses */}
            <div style={{
              marginTop: "2rem",
              padding: "1rem 1.25rem",
              background: "#f0fdf4",
              borderRadius: "14px",
              border: "1px solid #c6f6d5",
            }}>
              <div style={{
                display: "flex",
                gap: "0.6rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "0.9rem", color: "#059669", fontWeight: "700", fontFamily: "'Reem Kufi', 'Tajawal', sans-serif" }}>
                  الأسئلة:
                </span>
                {pretest.questions?.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(idx)}
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      border: "none",
                      background: answers[q.id]
                        ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                        : "#e5e7eb",
                      color: answers[q.id] ? "white" : "#6b7280",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontSize: "0.95rem",
                      fontFamily: "'Cairo', sans-serif"
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{
            padding: "1rem clamp(1rem, 4vw, 2.5rem)",
            background: "#f9fafb",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: "1rem",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <button
              onClick={handlePrev}
              disabled={currentQuestion === 0}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "12px",
                border: "2px solid #e5e7eb",
                background: "white",
                color: "#4b5563",
                cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                fontWeight: "700",
                fontSize: "0.95rem",
                fontFamily: "'Reem Kufi', 'Tajawal', sans-serif",
                opacity: currentQuestion === 0 ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              السابق ←
            </button>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ color: "#475569", fontSize: "0.95rem", fontFamily: "'Tajawal', sans-serif", fontWeight: "600" }}>
                الإجابات: {answered} من {pretest.questions?.length}
              </span>
            </div>

            {currentQuestion === pretest.questions?.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || loading}
                style={{
                  padding: "0.75rem 2rem",
                  borderRadius: "12px",
                  border: "none",
                  background: allAnswered
                    ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    : "#d1d5db",
                  color: "white",
                  cursor: allAnswered && !loading ? "pointer" : "not-allowed",
                  fontWeight: "700",
                  fontSize: "1rem",
                  fontFamily: "'Reem Kufi', 'Tajawal', sans-serif",
                  transition: "all 0.2s ease",
                  boxShadow: allAnswered ? "0 4px 12px rgba(249, 115, 22, 0.3)" : "none",
                }}
              >
                {loading ? "⏳ جاري التحقق..." : "🚀 إرسال الإجابات"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "1rem",
                  fontFamily: "'Reem Kufi', 'Tajawal', sans-serif",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                }}
              >
                ← التالي
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{
          marginTop: "2rem",
          padding: "1.1rem 1.5rem",
          background: "rgba(5, 150, 105, 0.07)",
          borderRadius: "14px",
          border: "1px solid rgba(5, 150, 105, 0.25)",
          fontSize: "1rem",
          color: "#047857",
          textAlign: "center",
          fontFamily: "'Amiri', 'Tajawal', serif",
          fontWeight: "600"
        }}>
          💡 خذ وقتك الكافي في الإجابة، هذا التقييم مخصص لقياس مستواك القبلي فقط!
        </div>
      </div>
    </div>
  );
}
