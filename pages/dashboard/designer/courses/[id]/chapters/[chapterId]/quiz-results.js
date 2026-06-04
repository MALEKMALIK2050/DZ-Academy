import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function QuizResults() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, chapterId, quizId } = router.query;
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCorrections, setShowCorrections] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    fetchResults();
  }, [quizId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/quiz/formatif/results?quizId=${quizId}`, {
        credentials: "include",
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Erreur récupération résultats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>⏳ Chargement...</div>;

  if (!results) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <div style={{ maxWidth: "800px", margin: "50px auto", padding: "2rem", background: "#fff5f5", borderRadius: "20px", border: "1px solid #fed7d7", textAlign: "center" }}>
          <h2 style={{ color: "#e53e3e" }}>❌ Résultats non trouvés</h2>
          <button
            onClick={() => router.push(`/dashboard/student/courses/${id}`)}
            style={{ background: "#1e40af", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
          >
            ← Retour au cours
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  const scorePercent = Math.round(results.score);
  const canRetry = results.canRetry;
  const isPassed = results.score >= 70;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
        {/* SCORE CARD */}
        <div style={{
          background: isPassed 
            ? "linear-gradient(135deg, #d1fae5, #a7f3d0)" 
            : "linear-gradient(135deg, #fee2e2, #fecaca)",
          border: isPassed ? "2px solid #059669" : "2px solid #dc2626",
          borderRadius: "20px",
          padding: "2rem",
          textAlign: "center",
          marginBottom: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            fontSize: "4rem",
            fontWeight: "800",
            color: isPassed ? "#059669" : "#dc2626",
            marginBottom: "0.5rem"
          }}>
            {scorePercent}%
          </div>

          <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.5rem" }}>
            {isPassed ? "✅ Bravo! Vous avez réussi!" : "⚠️ Vous n'avez pas atteint 70%"}
          </div>

          <div style={{ fontSize: "1rem", color: "#475569", marginBottom: "1.5rem" }}>
            {results.pointsObtenu} / {results.pointsTotal} points
          </div>

          <div style={{
            background: "rgba(255,255,255,0.5)",
            padding: "1rem",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            fontSize: "0.95rem",
            color: "#1e293b",
            fontWeight: "600"
          }}>
            {results.message}
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {canRetry && !isPassed && (
              <button
                onClick={() => router.push(`/dashboard/student/courses/${id}/chapters/${chapterId}/quiz/${quizId}`)}
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1rem",
                  boxShadow: "0 4px 12px rgba(249,115,22,0.3)"
                }}
              >
                🔄 Refaire le test
              </button>
            )}

            <button
              onClick={() => router.push(`/dashboard/student/courses/${id}`)}
              style={{
                background: "linear-gradient(135deg, #1e40af, #1e3a8a)",
                color: "white",
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "1rem",
                boxShadow: "0 4px 12px rgba(30,64,175,0.3)"
              }}
            >
              ← Retour au cours
            </button>
          </div>
        </div>

        {/* CORRECTIONS */}
        <div style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          border: "1px solid #edf2f7",
          overflow: "hidden"
        }}>
          <button
            onClick={() => setShowCorrections(!showCorrections)}
            style={{
              width: "100%",
              padding: "1.5rem",
              background: "#f8fafc",
              border: "none",
              borderBottom: "1px solid #edf2f7",
              fontSize: "1.1rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#1e293b"
            }}
          >
            <span>📝 {showCorrections ? "Masquer" : "Afficher"} les corrections</span>
            <span style={{ fontSize: "1.3rem" }}>{showCorrections ? "▼" : "▶"}</span>
          </button>

          {showCorrections && (
            <div style={{ padding: "1.5rem" }}>
              {results.corrections?.map((correction, idx) => (
                <div
                  key={idx}
                  style={{
                    background: correction.isCorrect ? "#f0fff4" : "#fff5f5",
                    border: `2px solid ${correction.isCorrect ? "#059669" : "#dc2626"}`,
                    borderRadius: "12px",
                    padding: "1.5rem",
                    marginBottom: "1rem"
                  }}
                >
                  {/* Question */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{
                        background: correction.isCorrect ? "#059669" : "#dc2626",
                        color: "white",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "700"
                      }}>
                        {correction.isCorrect ? "✅ CORRECT" : "❌ FAUX"}
                      </span>
                      <span style={{ color: "#718096", fontSize: "0.9rem" }}>
                        {correction.points} pt(s)
                      </span>
                    </div>
                    <h4 style={{ margin: "0.5rem 0", fontSize: "1.1rem", color: "#1e293b" }}>
                      Q{idx + 1}. {correction.texte}
                    </h4>
                  </div>

                  {/* Réponse étudiant */}
                  <div style={{ marginBottom: "1rem", padding: "1rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.9rem", color: "#718096", fontWeight: "600", marginBottom: "0.3rem" }}>
                      Votre réponse:
                    </div>
                    <div style={{ fontSize: "1rem", color: correction.isCorrect ? "#059669" : "#dc2626", fontWeight: "600" }}>
                      {correction.studentAnswer || "❌ Aucune réponse"}
                    </div>
                  </div>

                  {/* Bonne réponse */}
                  {!correction.isCorrect && (
                    <div style={{ padding: "1rem", background: "#f0fff4", borderRadius: "8px", border: "1px solid #c6f6d5" }}>
                      <div style={{ fontSize: "0.9rem", color: "#059669", fontWeight: "600", marginBottom: "0.3rem" }}>
                        ✅ Bonne réponse:
                      </div>
                      <div style={{ fontSize: "1rem", color: "#059669", fontWeight: "600" }}>
                        {correction.reponse}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MESSAGE D'ENCOURAGEMENT */}
        {!canRetry && !isPassed && (
          <div style={{
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            border: "2px solid #f59e0b",
            borderRadius: "20px",
            padding: "2rem",
            marginTop: "2rem",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📚</div>
            <h3 style={{ color: "#d97706", fontSize: "1.3rem", fontWeight: "700", margin: "0.5rem 0" }}>
              {results.message}
            </h3>
            <p style={{ color: "#92400e", fontSize: "1rem", margin: "1rem 0 0" }}>
              Prenez le temps d'étudier attentivement le chapitre avant de continuer.
            </p>
            <button
              onClick={() => router.push(`/dashboard/student/courses/${id}`)}
              style={{
                marginTop: "1.5rem",
                background: "linear-gradient(135deg, #92400e, #d97706)",
                color: "white",
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "1rem"
              }}
            >
              📖 Étudier le chapitre
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
