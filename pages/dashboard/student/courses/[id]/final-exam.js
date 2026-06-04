import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function FinalExamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { id: courseId } = router.query;

  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reponses, setReponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      // Récupérer le cours
      const courseRes = await fetch(`/api/courses/${courseId}`, {
        credentials: "include",
      });
      const courseData = await courseRes.json();
      setCourse(courseData);

      // Récupérer le quiz sommatif du cours
      if (courseData.quizFinal) {
        setQuiz(courseData.quizFinal);
        
        // Vérifier les tentatives restantes
        const infoRes = await fetch(
          `/api/quiz?quizId=${courseData.quizFinal.id}`,
          { credentials: "include" }
        );
        const infoData = await infoRes.json();
        setInfo(infoData);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement du test");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setReponses((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          quizId: quiz.id,
          reponses,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <div style={{ padding: "2rem", textAlign: "center" }}>⏳ Chargement...</div>
      </ProtectedRoute>
    );
  }

  if (error || !quiz) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <div style={{ padding: "2rem", color: "#e53e3e" }}>❌ {error || "Pas de test final"}</div>
      </ProtectedRoute>
    );
  }

  const DASHBOARD_TABS = [
    { key: "overview", label: "Mes cours", icon: "📚" },
  ];

  // Résultat affiché
  if (result) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <DashboardLayout
          user={user}
          roleIcon="👨‍🎓"
          customTitle={`${course?.title} — Résultat`}
          tabs={DASHBOARD_TABS}
          activeTab="overview"
          onTabChange={() => router.push("/dashboard/student")}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div
              style={{
                background: result.reussi ? "#dcfce7" : "#fee2e2",
                border: `2px solid ${result.reussi ? "#059669" : "#ef4444"}`,
                borderRadius: "20px",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                {result.reussi ? "🏆" : "❌"}
              </div>

              <h1
                style={{
                  margin: "0 0 1rem",
                  fontSize: "2rem",
                  color: result.reussi ? "#166534" : "#991b1b",
                }}
              >
                {result.reussi ? "Félicitations!" : "Résultat insuffisant"}
              </h1>

              <div style={{ fontSize: "3rem", fontWeight: "bold", margin: "1rem 0" }}>
                {result.score}%
              </div>

              <div
                style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                }}
              >
                <p style={{ margin: "0 0 0.5rem", color: "#718096" }}>
                  <strong>Questions correctes:</strong> {result.correct}/{result.total}
                </p>
                <p style={{ margin: "0 0 0.5rem", color: "#718096" }}>
                  <strong>Tentative:</strong> {result.tentatives}/{info?.maxTentatives}
                </p>
                <p style={{ margin: "0", color: "#718096" }}>
                  <strong>Seuil de réussite:</strong> {info?.seuil}%
                </p>
              </div>

              <div
                style={{
                  background: result.reussi ? "#f0fff4" : "#fff5f5",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                  color: result.reussi ? "#166534" : "#991b1b",
                  lineHeight: "1.6",
                }}
              >
                {result.message}
              </div>

              {!result.reussi && result.tentativesRestantes > 0 && (
                <button
                  onClick={() => {
                    setResult(null);
                    setReponses({});
                    setCurrentQuestion(0);
                    fetchData();
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#3182ce",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "1rem",
                  }}
                >
                  🔄 Réessayer ({result.tentativesRestantes} restantes)
                </button>
              )}

              <button
                onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
                style={{
                  marginLeft: "1rem",
                  padding: "0.75rem 1.5rem",
                  background: "#718096",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1rem",
                }}
              >
                ← Retour au cours
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Affichage du test
  const question = quiz.questions[currentQuestion];
  const answered = Object.keys(reponses).length;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <DashboardLayout
        user={user}
        roleIcon="👨‍🎓"
        customTitle={`${course?.title} — Test Final`}
        tabs={DASHBOARD_TABS}
        activeTab="overview"
        onTabChange={() => router.push("/dashboard/student")}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "20px",
              marginBottom: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <h1
              style={{
                margin: "0 0 1rem",
                fontSize: "2rem",
                fontWeight: "800",
                background: "linear-gradient(135deg, #dc2626, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🏁 Test Final
            </h1>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, color: "#718096" }}>
                Seuil de réussite: <strong>{info?.seuil}%</strong>
              </p>
              <p style={{ margin: 0, color: "#718096" }}>
                Tentatives: <strong>{info?.tentatives || 0}/{info?.maxTentatives}</strong>
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ fontSize: "0.9rem", color: "#718096", marginBottom: "0.5rem" }}>
                Question {currentQuestion + 1} / {quiz.questions.length}
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#e2e8f0",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "#dc2626",
                    width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Question */}
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
              border: "1px solid #edf2f7",
              marginBottom: "2rem",
            }}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <span
                style={{
                  background: "#dc2626",
                  color: "white",
                  padding: "0.3rem 0.8rem",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  marginRight: "0.5rem",
                }}
              >
                Q{currentQuestion + 1}
              </span>
              <strong style={{ fontSize: "1.1rem" }}>{question.texte}</strong>
              {question.points && (
                <span style={{ marginLeft: "1rem", color: "#718096", fontSize: "0.9rem" }}>
                  ({question.points} points)
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {question.choix.map((choice, i) => (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem",
                    background: reponses[question.id] === choice ? "#dcfce7" : "#f8fafc",
                    border:
                      reponses[question.id] === choice
                        ? "2px solid #059669"
                        : "1px solid #e2e8f0",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={choice}
                    checked={reponses[question.id] === choice}
                    onChange={() => handleAnswer(question.id, choice)}
                    style={{ cursor: "pointer" }}
                  />
                  {choice}
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "space-between",
              marginBottom: "2rem",
            }}
          >
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              style={{
                padding: "0.75rem 1.5rem",
                background: currentQuestion === 0 ? "#e2e8f0" : "#718096",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: currentQuestion === 0 ? "default" : "pointer",
                fontWeight: "600",
              }}
            >
              ← Précédent
            </button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#3182ce",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Suivant →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || answered < quiz.questions.length}
                style={{
                  padding: "0.75rem 1.5rem",
                  background:
                    submitting || answered < quiz.questions.length ? "#e2e8f0" : "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor:
                    submitting || answered < quiz.questions.length ? "default" : "pointer",
                  fontWeight: "600",
                }}
              >
                {submitting ? "⏳..." : `✅ Terminer (${answered}/${quiz.questions.length})`}
              </button>
            )}
          </div>

          {/* Réponses */}
          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <h4 style={{ margin: "0 0 1rem", color: "#2d3748" }}>
              Vos réponses ({answered}/{quiz.questions.length})
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
                gap: "0.5rem",
              }}
            >
              {quiz.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(i)}
                  style={{
                    padding: "0.5rem",
                    background: reponses[q.id]
                      ? currentQuestion === i
                        ? "#dc2626"
                        : "#059669"
                      : currentQuestion === i
                        ? "#3182ce"
                        : "#e2e8f0",
                    color: reponses[q.id] || currentQuestion === i ? "white" : "#718096",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
