import { useState } from "react";


export default function PretestModern({ pretest, course, user, onSubmit, loading }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSummary, setShowSummary] = useState(false);

  const question = pretest.questions?.[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / pretest.questions.length) * 100);
  const answered = Object.keys(answers).length;
  const allAnswered = answered === pretest.questions.length;

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
  console.log('📤 Submit clicked');
  console.log('allAnswered:', allAnswered);
  console.log('answers:', answers);
  if (allAnswered) {
    console.log('✅ Submitting...');
    onSubmit(answers);
  } else {
    console.log('❌ Pas toutes les réponses');
  }
};

  return (
    <div style={{
      background: "linear-gradient(135deg, #f0fdf4 0%, #fef2f2 100%)",
      minHeight: "100vh",
      padding: "1rem",
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
          color: "white",
          padding: "1rem",
          borderRadius: "16px",
          marginBottom: "2rem",
          boxShadow: "0 10px 30px rgba(5, 150, 105, 0.2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "2.5rem" }}>🎯</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: "800" }}>Pretest</h1>
              <p style={{ margin: "0.5rem 0 0", opacity: 0.9, fontSize: "0.95rem" }}>
                Évalue tes connaissances avant de commencer
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            padding: "1rem",
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              <span>Progression</span>
              <span style={{ fontWeight: "700" }}>{progress}%</span>
            </div>
            <div style={{
              background: "rgba(255, 255, 255, 0.3)",
              borderRadius: "10px",
              height: "8px",
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
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "1.2rem",
              }}>
                {currentQuestion + 1}
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", color: "#059669", fontWeight: "700" }}>
                  Question {currentQuestion + 1} sur {pretest.questions?.length}
                </div>
              </div>
            </div>

            <h2 style={{
              margin: "0 0 1.5rem",
              fontSize: "clamp(1rem, 3.5vw, 1.4rem)",
              fontWeight: "700",
              color: "#1f2937",
              lineHeight: "1.5",
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
                        fontSize: "0.7rem",
                        color: "white",
                        fontWeight: "800",
                        flexShrink: 0,
                      }}>
                        {isSelected && "✓"}
                      </div>
                      <span style={{
                        fontSize: "1rem",
                        color: isSelected ? "#059669" : "#374151",
                        fontWeight: isSelected ? "600" : "500",
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
              borderRadius: "12px",
              border: "1px solid #c6f6d5",
            }}>
              <div style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "0.85rem", color: "#059669", fontWeight: "600" }}>
                  Réponses:
                </span>
                {pretest.questions?.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(idx)}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      border: "none",
                      background: answers[q.id]
                        ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                        : "#e5e7eb",
                      color: answers[q.id] ? "white" : "#6b7280",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontSize: "0.9rem",
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
                padding: "0.6rem 1rem",
                borderRadius: "10px",
                border: "2px solid #e5e7eb",
                background: "white",
                color: "#6b7280",
                cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
                opacity: currentQuestion === 0 ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              ← Précédent
            </button>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                {answered} / {pretest.questions?.length} réponses
              </span>
            </div>

            {currentQuestion === pretest.questions?.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || loading}
                style={{
                  padding: "0.75rem 2rem",
                  borderRadius: "10px",
                  border: "none",
                  background: allAnswered
                    ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    : "#d1d5db",
                  color: "white",
                  cursor: allAnswered && !loading ? "pointer" : "not-allowed",
                  fontWeight: "700",
                  fontSize: "1rem",
                  transition: "all 0.2s ease",
                  boxShadow: allAnswered ? "0 4px 12px rgba(249, 115, 22, 0.3)" : "none",
                }}
              >
                {loading ? "⏳ Vérification..." : "✅ Soumettre"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                }}
              >
                Suivant →
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{
          marginTop: "2rem",
          padding: "1rem 1.5rem",
          background: "rgba(5, 150, 105, 0.05)",
          borderRadius: "12px",
          border: "1px solid rgba(5, 150, 105, 0.2)",
          fontSize: "0.9rem",
          color: "#047857",
          textAlign: "center",
        }}>
          💡 Prends ton temps pour répondre. C'est juste pour évaluer ton niveau!
        </div>
      </div>
    </div>
  );
}
