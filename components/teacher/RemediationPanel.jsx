// /components/teacher/RemediationPanel.jsx
import { useEffect, useState } from "react";

const STATUT_LABEL = {
  EN_ATTENTE: { label: "قيد الانتظار", color: "#b7791f", bg: "#fffff0", border: "#f6e05e" },
  REPONDU:    { label: "تم الرد",    color: "#2b6cb0", bg: "#ebf8ff", border: "#90cdf4" },
  DEBLOQUE:   { label: "تم الفتح",  color: "#276749", bg: "#f0fff4", border: "#9ae6b4" },
};

export default function RemediationPanel({ courseId }) {
  const [remediations, setRemediations]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filtreStatut, setFiltreStatut]   = useState("EN_ATTENTE");
  const [ouvert, setOuvert]               = useState(null); // id ouvert
  const [reponses, setReponses]           = useState({});
  const [envoi, setEnvoi]                 = useState(null);
  const [feedback, setFeedback]           = useState({});

  useEffect(() => { fetchRemediations(); }, [courseId, filtreStatut]);

  const fetchRemediations = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/student/remediation?courseId=${courseId}&statut=${filtreStatut}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) setRemediations(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRepondre = async (remediationId, debloquer) => {
    const reponse = reponses[remediationId];
    if (!reponse?.trim()) return;
    setEnvoi(remediationId);
    setFeedback((p) => ({ ...p, [remediationId]: "" }));
    try {
      const res = await fetch("/api/student/remediation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ remediationId, reponse, debloquer }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback((p) => ({ ...p, [remediationId]: { ok: true, msg: data.message } }));
        // Retirer de la liste EN_ATTENTE ou mettre à jour
        setRemediations((prev) =>
          prev.filter((r) => r.id !== remediationId)
        );
        setOuvert(null);
      } else {
        setFeedback((p) => ({ ...p, [remediationId]: { ok: false, msg: data.error } }));
      }
    } catch {
      setFeedback((p) => ({ ...p, [remediationId]: { ok: false, msg: "خطأ في الخادم" } }));
    } finally {
      setEnvoi(null);
    }
  };

  const nbTotal   = remediations.length;
  const statutCfg = STATUT_LABEL[filtreStatut];

  return (
    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }} dir="rtl">

      {/* ── Header ── */}
      <div style={{ background: "#f7fafc", borderBottom: "1px solid #e2e8f0", padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, color: "#2d3748", fontSize: "1.1rem" }}>
              🩺 المعالجة البيداغوجية
            </h3>
            <p style={{ margin: "0.2rem 0 0", color: "#718096", fontSize: "0.85rem" }}>
              طلبات التلاميذ المحظورين بعد 3 محاولات
            </p>
          </div>
          <button onClick={fetchRemediations} style={{ background: "none", border: "1px solid #e2e8f0", color: "#4a5568", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
            🔄 تحديث
          </button>
        </div>

        {/* Filtres statut */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
          {Object.entries(STATUT_LABEL).map(([statut, cfg]) => (
            <button
              key={statut}
              onClick={() => setFiltreStatut(statut)}
              style={{
                padding: "0.35rem 0.9rem",
                borderRadius: "20px",
                border: `1.5px solid ${filtreStatut === statut ? cfg.border : "#e2e8f0"}`,
                background: filtreStatut === statut ? cfg.bg : "white",
                color: filtreStatut === statut ? cfg.color : "#718096",
                fontWeight: filtreStatut === statut ? "700" : "400",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#718096" }}>جارٍ التحميل...</div>
      ) : nbTotal === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#718096" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
          <p style={{ margin: 0 }}>لا توجد طلبات "{STATUT_LABEL[filtreStatut].label}".</p>
        </div>
      ) : (
        remediations.map((r) => {
          const isOpen    = ouvert === r.id;
          const erreurs   = (r.erreursDetail || []).filter((e) => !e.correct);
          const cfg       = STATUT_LABEL[r.statut] || STATUT_LABEL.EN_ATTENTE;
          const fb        = feedback[r.id];

          return (
            <div key={r.id} style={{ borderBottom: "1px solid #f7fafc" }}>
              {/* ── Ligne résumé ── */}
              <div
                onClick={() => setOuvert(isOpen ? null : r.id)}
                style={{ padding: "1.25rem 1.5rem", cursor: "pointer", display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "1rem", alignItems: "center", background: isOpen ? "#f8fafc" : "white" }}
              >
                {/* Étudiant */}
                <div>
                  <div style={{ fontWeight: "700", color: "#2d3748" }}>
                    👤 {r.student.prenom} {r.student.nom}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#718096" }}>{r.student.email}</div>
                </div>

                {/* Quiz */}
                <div>
                  <div style={{ fontWeight: "600", color: "#4a5568", fontSize: "0.9rem" }}>
                    📝 {r.quiz?.chapter?.title || "الاختبار النهائي"}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#718096" }}>
                    {new Date(r.createdAt).toLocaleDateString("ar-DZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Score */}
                <span style={{ background: "#fed7d7", color: "#c53030", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.82rem", fontWeight: "700" }}>
                  {r.score}%
                </span>

                {/* Statut + chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.78rem", fontWeight: "600" }}>
                    {cfg.label}
                  </span>
                  <span style={{ color: "#a0aec0", fontSize: "1rem", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                </div>
              </div>

              {/* ── Détail ouvert ── */}
              {isOpen && (
                <div style={{ padding: "0 1.5rem 1.5rem", background: "#f8fafc" }}>

                  {/* Message de l'étudiant */}
                  <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#718096", marginBottom: "0.5rem" }}>رسالة التلميذ</div>
                    <p style={{ margin: 0, color: "#2d3748", lineHeight: "1.6", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                      {r.messageEtudiant}
                    </p>
                  </div>

                  {/* Erreurs du quiz */}
                  {erreurs.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#c53030", marginBottom: "0.5rem" }}>
                        ❌ أخطاء التلميذ ({erreurs.length} أسئلة خاطئة)
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {erreurs.map((e, i) => (
                          <div key={i} style={{ background: "white", border: "1px solid #fed7d7", borderRadius: "8px", padding: "0.9rem" }}>
                            <p style={{ margin: "0 0 0.5rem", fontWeight: "600", color: "#2d3748", fontSize: "0.9rem" }}>
                              {e.texte}
                            </p>
                            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", flexWrap: "wrap" }}>
                              <span style={{ color: "#e53e3e" }}>
                                ✗ إجابته: <strong>{String(e.repEtudiant ?? "—")}</strong>
                              </span>
                              <span style={{ color: "#276749" }}>
                                ✓ الصحيحة: <strong>{String(e.bonneReponse ?? "—")}</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Réponse existante */}
                  {r.reponseEnseignant && (
                    <div style={{ background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#2b6cb0", marginBottom: "0.5rem" }}>ردك السابق</div>
                      <p style={{ margin: 0, color: "#1e3a5f", fontSize: "0.9rem", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                        {r.reponseEnseignant}
                      </p>
                    </div>
                  )}

                  {/* Zone de réponse (si pas encore débloqué) */}
                  {r.statut !== "DEBLOQUE" && (
                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#4a5568", marginBottom: "0.5rem" }}>
                        ردك البيداغوجي
                      </div>
                      <textarea
                        value={reponses[r.id] || ""}
                        onChange={(e) => setReponses((p) => ({ ...p, [r.id]: e.target.value }))}
                        placeholder="اشرح الخطأ، قدم توجيهات للفهم، موارد للمراجعة..."
                        style={{ width: "100%", minHeight: "110px", padding: "0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.9rem", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: "1.6" }}
                        onFocus={(e) => (e.target.style.borderColor = "#3182ce")}
                        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                      />

                      {fb && (
                        <p style={{ color: fb.ok ? "#276749" : "#e53e3e", fontSize: "0.85rem", margin: "0.5rem 0" }}>
                          {fb.msg}
                        </p>
                      )}

                      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                        {/* Répondre sans débloquer */}
                        <button
                          onClick={() => handleRepondre(r.id, false)}
                          disabled={envoi === r.id || !reponses[r.id]?.trim()}
                          style={{
                            padding: "0.65rem 1.25rem",
                            background: "white",
                            color: "#2b6cb0",
                            border: "1.5px solid #90cdf4",
                            borderRadius: "8px",
                            cursor: envoi === r.id || !reponses[r.id]?.trim() ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            opacity: !reponses[r.id]?.trim() ? 0.5 : 1,
                          }}
                        >
                          💬 الرد دون فتح
                        </button>

                        {/* Répondre ET débloquer */}
                        <button
                          onClick={() => handleRepondre(r.id, true)}
                          disabled={envoi === r.id || !reponses[r.id]?.trim()}
                          style={{
                            padding: "0.65rem 1.25rem",
                            background: envoi === r.id || !reponses[r.id]?.trim()
                              ? "#a0aec0"
                              : "linear-gradient(135deg, #38a169, #276749)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: envoi === r.id || !reponses[r.id]?.trim() ? "not-allowed" : "pointer",
                            fontWeight: "700",
                            fontSize: "0.9rem",
                          }}
                        >
                          {envoi === r.id ? "⏳ جاري الإرسال..." : "🔓 الرد والفتح"}
                        </button>
                      </div>
                    </div>
                  )}

                  {r.statut === "DEBLOQUE" && (
                    <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: "8px", padding: "0.75rem 1rem", textAlign: "center" }}>
                      <span style={{ color: "#276749", fontWeight: "700" }}>
                        ✅ تم فتح الاختبار للتلميذ — يمكنه إعادته بـ 3 محاولات جديدة
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
