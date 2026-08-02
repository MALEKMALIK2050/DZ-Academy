// /components/student/RemediationRequest.jsx
import { useEffect, useState } from "react";

export default function RemediationRequest({ quiz, quizResult, score }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [demande, setDemande] = useState(null); // demande existante
  const [loadingDemande, setLoadingDemande] = useState(true);
  const [feedback, setFeedback] = useState("");

  // Vérifier si une demande existe déjà
  useEffect(() => {
    if (!quiz?.id) return;
    fetch(`/api/student/remediation?quizId=${quiz.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setDemande(data))
      .catch(console.error)
      .finally(() => setLoadingDemande(false));
  }, [quiz?.id]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setFeedback("");
    try {
      const res = await fetch("/api/student/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quizId: quiz.id, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setDemande({ statut: "EN_ATTENTE", messageEtudiant: message, createdAt: new Date() });
        setFeedback("success");
      } else {
        setFeedback(data.error || "خطأ في الإرسال");
      }
    } catch {
      setFeedback("خطأ في الخادم");
    } finally {
      setSending(false);
    }
  };

  // Erreurs du quiz (questions fausses uniquement)
  const erreurs = (quizResult?.detail || []).filter((r) => !r.correct);
  const totalQuestions = quizResult?.total || 0;

  if (loadingDemande) return null;

  return (
    <div style={{ marginTop: "1.5rem" }} dir="rtl">

      {/* ── Récapitulatif des erreurs ── */}
      {erreurs.length > 0 && quiz?.questions && (
        <div style={{ background: "#fff5f5", border: "1.5px solid #feb2b2", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 1rem", color: "#c53030", fontSize: "1rem" }}>
            ❌ أخطاؤك ({erreurs.length} / {totalQuestions} أسئلة)
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {erreurs.map((r) => {
              const q = quiz.questions.find((q) => q.id === r.questionId);
              if (!q) return null;
              return (
                <div key={r.questionId} style={{ background: "white", border: "1px solid #fed7d7", borderRadius: "8px", padding: "0.9rem" }}>
                  <p style={{ margin: "0 0 0.4rem", fontWeight: "600", color: "#2d3748", fontSize: "0.95rem" }}>
                    {q.texte}
                  </p>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                    <span style={{ color: "#e53e3e" }}>
                      إجابتك: <strong>{String(r.repEtudiant ?? "—")}</strong>
                    </span>
                    <span style={{ color: "#276749" }}>
                      الإجابة الصحيحة: <strong>{String(q.reponse ?? "—")}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Demande déjà envoyée ── */}
      {demande ? (
        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1.5px solid #e2e8f0" }}>
          {/* Statut */}
          <div style={{
            padding: "1rem 1.25rem",
            background: demande.statut === "DEBLOQUE" ? "#f0fff4"
              : demande.statut === "REPONDU" ? "#ebf8ff"
              : "#fffff0",
            borderBottom: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", gap: "0.75rem",
          }}>
            <span style={{ fontSize: "1.5rem" }}>
              {demande.statut === "DEBLOQUE" ? "🔓" : demande.statut === "REPONDU" ? "💬" : "⏳"}
            </span>
            <div>
              <div style={{ fontWeight: "700", color: "#2d3748" }}>
                {demande.statut === "DEBLOQUE"
                  ? "تم فتح الاختبار! يمكنك إعادة الاختبار."
                  : demande.statut === "REPONDU"
                  ? "لقد أجاب أستاذك"
                  : "تم إرسال الطلب — في انتظار أستاذك"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#718096" }}>
                أُرسلت في {new Date(demande.createdAt).toLocaleDateString("ar-DZ", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Message étudiant */}
          <div style={{ padding: "1rem 1.25rem", background: "white", borderBottom: "1px solid #f7fafc" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#718096", marginBottom: "0.4rem" }}>رسالتك</div>
            <p style={{ margin: 0, color: "#4a5568", fontSize: "0.95rem", lineHeight: "1.6" }}>
              {demande.messageEtudiant}
            </p>
          </div>

          {/* Réponse enseignant */}
          {demande.reponseEnseignant && (
            <div style={{ padding: "1rem 1.25rem", background: "#f0f9ff", borderBottom: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#1d4ed8", marginBottom: "0.4rem" }}>
                💬 رد أستاذك
                {demande.teacher && (
                  <span style={{ fontWeight: "400", marginRight: "0.5rem" }}>
                    — {demande.teacher.prenom} {demande.teacher.nom}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, color: "#1e3a5f", fontSize: "0.95rem", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                {demande.reponseEnseignant}
              </p>
            </div>
          )}

          {demande.statut === "DEBLOQUE" && (
            <div style={{ padding: "1rem 1.25rem", background: "#f0fff4", textAlign: "center" }}>
              <p style={{ margin: 0, color: "#276749", fontWeight: "700" }}>
                🎉 لديك 3 محاولات جديدة. حظا موفقا!
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Formulaire d'envoi ── */
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#f7fafc", borderBottom: "1px solid #e2e8f0", padding: "1rem 1.25rem" }}>
            <h4 style={{ margin: 0, color: "#2d3748", fontSize: "1rem" }}>
              ✉️ اتصل بأستاذك
            </h4>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#718096" }}>
              اشرح الصعوبات التي تواجهها. سيرى أستاذك أخطاءك وسيساعدك على التقدم.
            </p>
          </div>
          <div style={{ padding: "1.25rem" }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="مثال: أواجه صعوبة في فهم الجزء الخاص بالكسور. الأسئلة 2 و 4 كانت صعبة لأن..."
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "0.85rem",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3182ce")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            {feedback && feedback !== "success" && (
              <p style={{ color: "#e53e3e", fontSize: "0.85rem", margin: "0.5rem 0 0" }}>{feedback}</p>
            )}
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              style={{
                marginTop: "1rem",
                width: "100%",
                padding: "0.9rem",
                background: sending || !message.trim()
                  ? "#a0aec0"
                  : "linear-gradient(135deg, #3182ce, #2b6cb0)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: sending || !message.trim() ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "700",
              }}
            >
              {sending ? "⏳ جاري الإرسال..." : "📨 إرسال إلى أستاذي"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
