import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function TeacherCourse() {
  const router     = useRouter();
  const { id }     = router.query;
  const { user }   = useAuth();

  const [course,         setCourse]         = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState("contenu");
  const [activeChapter,  setActiveChapter]  = useState(null);
  const [devoirs,        setDevoirs]        = useState([]);
  const [error,          setError]          = useState("");

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(`/api/courses/${id}`,        { credentials: "include" }),
        fetch(`/api/teacher/students`,     { credentials: "include" }),
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();

      if (!cRes.ok) return setError(cData.error || "Erreur chargement");
      setCourse(cData);
      if (cData.chapters?.length > 0) setActiveChapter(cData.chapters[0]);

      // Filtrer enrollments pour ce cours
      const courseEnrollments = (sData?.enrollments || []).filter((e) => e.courseId === parseInt(id));
      setEnrollments(courseEnrollments);
      setQuizResults(sData?.quizResults || []);
      setDevoirs(sData?.devoirs || []);
    } catch { setError("Erreur serveur"); }
    finally { setLoading(false); }
  };

  if (loading) return <p style={{ padding: "2rem" }}>Chargement...</p>;
  if (error)   return <p style={{ color: "red", padding: "2rem" }}>{error}</p>;

  const TABS = [
    { key: "contenu",  label: "📚 Contenu du cours" },
    { key: "devoirs",  label: `📋 Devoirs à corriger (${devoirs.filter((d) => d.rendus?.some((r) => r.note === null)).length})` },
  ];

  return (
    <ProtectedRoute allowedRoles={["TEACHER", "DESIGNER"]}>
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

        {/* Header */}
        <div style={{ background: "#1a202c", color: "white", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => router.push("/dashboard/teacher")} style={{ background: "none", border: "none", color: "#a0aec0", cursor: "pointer" }}>
            ← Retour
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem" }}>{course?.title}</h1>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#a0aec0" }}>
              {[course?.matiere, course?.niveau, course?.annee].filter(Boolean).join(" • ")}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", padding: "0 2rem", borderBottom: "2px solid #e2e8f0", background: "white" }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "0.75rem 1.25rem", border: "none", cursor: "pointer", background: "none",
              borderBottom: tab === t.key ? "3px solid #3182ce" : "3px solid transparent",
              color: tab === t.key ? "#3182ce" : "#718096",
              fontWeight: tab === t.key ? "bold" : "normal",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>

          {/* ── Tab : Contenu cours ── */}
          {tab === "contenu" && (
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "2rem" }}>

              {/* Sidebar */}
              <div>
                <h3 style={{ margin: "0 0 1rem", color: "#4a5568" }}>📚 Chapitres</h3>
                {course?.chapters?.map((ch, i) => (
                  <div key={ch.id}
                    onClick={() => setActiveChapter(ch)}
                    style={{
                      padding: "0.75rem", borderRadius: "8px", marginBottom: "0.4rem", cursor: "pointer",
                      background: activeChapter?.id === ch.id ? "#3182ce" : "#f7fafc",
                      color:      activeChapter?.id === ch.id ? "white"    : "#2d3748",
                    }}>
                    {i + 1}. {ch.title}
                  </div>
                ))}

                {course?.quizFinal && (
                  <div style={{ padding: "0.75rem", borderRadius: "8px", marginTop: "1rem", background: "#faf5ff", color: "#805ad5", fontWeight: "bold", cursor: "default" }}>
                    📝 Test sommatif final
                  </div>
                )}
              </div>

              {/* Contenu chapitre */}
              {activeChapter && (
                <div>
                  <h2 style={{ marginTop: 0 }}>{activeChapter.title}</h2>
                  {activeChapter.objectifs && (
                    <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                      🎯 <strong>Objectifs :</strong> {activeChapter.objectifs}
                    </div>
                  )}

                  {/* Supports */}
                  {activeChapter.supports?.length > 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h3>📎 Supports pédagogiques</h3>
                      <div style={{ display: "grid", gap: "0.75rem" }}>
                        {activeChapter.supports.map((s) => (
                          s.type === "TEXTE" ? (
                            <div key={s.id} style={{ background: "white", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "10px" }}>
                              {s.nom && <h4 style={{ margin: "0 0 0.75rem", color: "#2d3748", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>{s.nom}</h4>}
                              <div dangerouslySetInnerHTML={{ __html: s.contenu }} style={{ lineHeight: "1.6", color: "#2d3748" }} />
                            </div>
                          ) : (
                            <a key={s.id} href={s.url} target="_blank" rel="noreferrer"
                              style={{ background: "white", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "10px", display: "flex", alignItems: "center", gap: "1rem", textDecoration: "none", color: "#2d3748" }}>
                              <span style={{ background: typeColor(s.type), color: "white", padding: "0.3rem 0.8rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold" }}>
                                {s.type}
                              </span>
                              <span style={{ color: "#3182ce" }}>{s.nom || s.url}</span>
                              <span style={{ marginLeft: "auto", color: "#a0aec0" }}>→</span>
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quiz formatif — lecture seule */}
                  {activeChapter.quiz && (
                    <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "1.25rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
                      <h3 style={{ margin: "0 0 0.75rem" }}>📝 Quiz formatif</h3>
                      <p style={{ color: "#718096", fontSize: "0.9rem", margin: 0 }}>
                        {activeChapter.quiz.questions?.length || 0} question(s) — seuil de réussite : 90%
                      </p>
                    </div>
                  )}

                  {/* Devoirs du chapitre */}
                  {activeChapter.devoirs?.length > 0 && (
                    <div>
                      <h3>📋 Devoirs</h3>
                      {activeChapter.devoirs.map((d) => {
                        const deadline = new Date(d.dateLimit);
                        const depasse  = new Date() > deadline;
                        return (
                          <div key={d.id} style={{ background: "white", border: `1px solid ${depasse ? "#feb2b2" : "#fbd38d"}`, padding: "1.25rem", borderRadius: "10px", marginBottom: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <strong>{d.titre}</strong>
                              <span style={{ background: depasse ? "#e53e3e" : "#dd6b20", color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem" }}>
                                {depasse ? "⛔ Clôturé" : `⏰ ${deadline.toLocaleDateString("fr-FR")}`}
                              </span>
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: d.consigne }} style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#4a5568" }} />
                            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#718096" }}>
                              {d.rendus?.length || 0} rendu(s)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* ── Tab : Devoirs à corriger ── */}
          {tab === "devoirs" && (
            <div>
              {devoirs.length === 0 ? (
                <p style={{ color: "#718096" }}>Aucun devoir pour ce cours.</p>
              ) : (
                devoirs.map((d) => {
                  const deadline = new Date(d.dateLimit);
                  const depasse  = new Date() > deadline;
                  const rendusNonNotes = d.rendus?.filter((r) => r.note === null || r.note === undefined) || [];

                  return (
                    <div key={d.id} style={{ background: "#f7fafc", padding: "1.25rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <div>
                          <strong style={{ fontSize: "1.05rem" }}>📋 {d.titre}</strong>
                          <div style={{ fontSize: "0.85rem", color: "#718096" }}>Chapitre : {d.chapter?.title}</div>
                          <div style={{ fontSize: "0.85rem", color: depasse ? "#e53e3e" : "#dd6b20" }}>
                            {depasse ? "⛔ Clôturé" : "⏰ Deadline"} : {deadline.toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ background: "#3182ce", color: "white", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.85rem" }}>
                            {d.rendus?.length || 0} rendu(s)
                          </div>
                          {rendusNonNotes.length > 0 && (
                            <div style={{ background: "#e53e3e", color: "white", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                              {rendusNonNotes.length} à corriger
                            </div>
                          )}
                        </div>
                      </div>

                      {d.rendus?.length === 0 ? (
                        <p style={{ color: "#718096", fontSize: "0.9rem" }}>Aucun rendu pour ce devoir.</p>
                      ) : (
                        d.rendus.map((r) => (
                          <RenduCard key={r.id} rendu={r} devoirId={d.id} depasse={depasse} onRefresh={fetchAll} />
                        ))
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}

// ── Composant correction rendu ────────────────────────────
function RenduCard({ rendu, devoirId, depasse, onRefresh }) {
  const [note,     setNote]     = useState(rendu.note ?? "");
  const [feedback, setFeedback] = useState(rendu.feedback || "");
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState("");
  const [error,    setError]    = useState("");

  const handleNote = async () => {
    if (note === "" || note < 0 || note > 20) return setError("Note entre 0 et 20 obligatoire");
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/devoirs/${devoirId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ renduId: rendu.id, note: parseFloat(note), feedback }),
      });
      if (res.ok) { setSuccess("✅ Note enregistrée !"); onRefresh(); }
      else { const d = await res.json(); setError(d.error || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <span style={{ background: rendu.fichierType === "PDF" ? "#e53e3e" : rendu.fichierType === "WORD" ? "#3182ce" : "#38a169", color: "white", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem" }}>
          {rendu.fichierType}
        </span>
        <strong>{rendu.student?.prenom} {rendu.student?.nom}</strong>
        <span style={{ fontSize: "0.8rem", color: "#718096" }}>{rendu.fichierNom}</span>
        <a href={rendu.fichierUrl} target="_blank" rel="noreferrer"
          style={{ marginLeft: "auto", background: "#3182ce", color: "white", padding: "0.3rem 0.8rem", borderRadius: "6px", fontSize: "0.85rem", textDecoration: "none" }}>
          📥 Télécharger
        </a>
      </div>

      {/* Note actuelle */}
      {rendu.note !== null && rendu.note !== undefined && (
        <div style={{ background: "#f0fff4", padding: "0.5rem 0.75rem", borderRadius: "6px", marginBottom: "0.75rem" }}>
          <span style={{ fontWeight: "bold", color: rendu.note >= 10 ? "#38a169" : "#e53e3e" }}>
            Note : {rendu.note}/20
          </span>
          {rendu.feedback && <span style={{ color: "#4a5568", marginLeft: "0.75rem" }}>— {rendu.feedback}</span>}
        </div>
      )}

      {/* Formulaire notation */}
      {depasse && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr auto", gap: "0.5rem", alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "#718096", display: "block", marginBottom: "0.2rem" }}>Note /20</label>
              <input type="number" min="0" max="20" step="0.5" value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #cbd5e0", borderRadius: "6px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "#718096", display: "block", marginBottom: "0.2rem" }}>Feedback</label>
              <input placeholder="Commentaire pour l'élève..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #cbd5e0", borderRadius: "6px" }}
              />
            </div>
            <button onClick={handleNote} disabled={saving}
              style={{ background: "#38a169", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
              {saving ? "..." : "💾 Noter"}
            </button>
          </div>
          {error   && <p style={{ color: "red",   fontSize: "0.85rem", margin: "0.5rem 0 0" }}>{error}</p>}
          {success && <p style={{ color: "green", fontSize: "0.85rem", margin: "0.5rem 0 0" }}>{success}</p>}
        </div>
      )}

      {!depasse && (
        <p style={{ color: "#718096", fontSize: "0.85rem", fontStyle: "italic" }}>
          ⏳ Notation disponible après la date limite
        </p>
      )}
    </div>
  );
}

function typeColor(type) {
  const colors = { PDF: "#e53e3e", VIDEO: "#3182ce", IMAGE: "#38a169", PPT: "#dd6b20", SCORM: "#805ad5", ARTICULATE: "#d69e2e", TEXTE: "#319795" };
  return colors[type] || "#718096";
}

const thStyle = { padding: "0.75rem", textAlign: "left", fontWeight: "bold" };
const tdStyle = { padding: "0.75rem" };