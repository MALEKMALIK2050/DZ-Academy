import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function QuizSommatif() {
  const router = useRouter();
  const { id } = router.query;

  const [course,       setCourse]       = useState(null);
  const [questions,    setQuestions]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [addingQ,      setAddingQ]      = useState(false);
  const [questionType, setQuestionType] = useState("QCM");
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");

  const emptyQuestion = {
    texte: "", choix: ["", "", "", ""], reponse: "", points: 1,
    texteTrous: "", paires: [{ gauche: "", droite: "" }, { gauche: "", droite: "" }],
    elements: ["", "", "", ""], reponsesMultiples: [],
  };
  const [newQuestion, setNewQuestion] = useState(emptyQuestion);

  useEffect(() => {
    if (!id) return;
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res  = await fetch(`/api/courses/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Erreur chargement");
      setCourse(data);
      setQuestions(data.quizFinal?.questions || []);
    } catch { setError("Erreur serveur"); }
    finally { setLoading(false); }
  };

  const handleAddQuestion = async () => {
    setError(""); setSuccess("");
    let payload = { courseId: id, type: questionType, texte: newQuestion.texte, points: newQuestion.points };

    switch (questionType) {
      case "QCM": {
        const choix = newQuestion.choix.filter((c) => c.trim());
        if (!newQuestion.texte || choix.length < 2 || !newQuestion.reponse)
          return setError("Question, au moins 2 choix et bonne réponse obligatoires");
        payload.choix   = choix;
        payload.reponse = newQuestion.reponse;
        break;
      }
      case "QCM_MULTIPLE": {
        const choix  = newQuestion.choix.filter((c) => c.trim());
        const bonnes = newQuestion.reponsesMultiples.filter((r) => r.trim());
        if (!newQuestion.texte || choix.length < 2 || bonnes.length < 1)
          return setError("Au moins 2 choix et 1 bonne réponse obligatoires");
        payload.choix   = choix;
        payload.reponse = JSON.stringify(bonnes);
        break;
      }
      case "VRAI_FAUX": {
        if (!newQuestion.texte || !newQuestion.reponse)
          return setError("Affirmation et réponse obligatoires");
        payload.choix   = ["Vrai", "Faux"];
        payload.reponse = newQuestion.reponse;
        break;
      }
      case "OUVERTE": {
        if (!newQuestion.texte || !newQuestion.reponse)
          return setError("Question et réponse modèle obligatoires");
        payload.choix   = [];
        payload.reponse = newQuestion.reponse;
        break;
      }
      case "GAP": {
        if (!newQuestion.texteTrous) return setError("Texte à trous obligatoire");
        const trous = (newQuestion.texteTrous.match(/\[trou\]/gi) || []).length;
        if (trous === 0) return setError("Ajoutez au moins un [trou]");
        payload.texte   = newQuestion.texteTrous;
        payload.choix   = [];
        payload.reponse = JSON.stringify(newQuestion.reponse.split(",").map((r) => r.trim()));
        break;
      }
      case "MATCHING": {
        const paires = newQuestion.paires.filter((p) => p.gauche.trim() && p.droite.trim());
        if (!newQuestion.texte || paires.length < 2) return setError("Au moins 2 paires obligatoires");
        payload.choix   = paires.map((p) => p.gauche);
        payload.reponse = JSON.stringify(paires.reduce((acc, p) => ({ ...acc, [p.gauche]: p.droite }), {}));
        break;
      }
      case "ORDERING": {
        const elements = newQuestion.elements.filter((e) => e.trim());
        if (!newQuestion.texte || elements.length < 2) return setError("Au moins 2 éléments obligatoires");
        payload.choix   = [...elements].sort(() => Math.random() - 0.5);
        payload.reponse = JSON.stringify(elements);
        break;
      }
      default: return setError("Type invalide");
    }

    try {
      const res = await fetch("/api/quiz/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess("✅ Question ajoutée !");
        setNewQuestion(emptyQuestion);
        setAddingQ(false);
        setQuestionType("QCM");
        fetchCourse();
      } else {
        const d = await res.json();
        setError(d.error || "Erreur ajout question");
      }
    } catch { setError("Erreur serveur"); }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm("Supprimer cette question ?")) return;
    try {
      await fetch("/api/quiz/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId }),
      });
      fetchCourse();
    } catch {}
  };

  const handleDeleteQuiz = async () => {
    if (!confirm("Attention ! Voulez-vous vraiment vider tout le test sommatif ? Toutes les questions seront supprimées.")) return;
    try {
      await fetch("/api/quiz/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId: id }),
      });
      fetchCourse();
    } catch {}
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>

        <button onClick={() => router.push(`/dashboard/designer/courses/${id}`)} style={btnBack}>
          ← Retour au cours
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>📝 Test sommatif — {course?.title}</h1>
            <p style={{ color: "#718096", margin: "0.5rem 0 1rem" }}>
              Seuil de réussite : 90% — Ce test débloque le certificat de fin de cours
            </p>
          </div>
          <button
            onClick={() => router.push(`/dashboard/designer/courses/${id}/import-quiz`)}
            style={{ ...btnPrimary, background: "#059669" }}
          >
            📥 Importer un test
          </button>
        </div>

        {error   && <p style={{ color: "red",   background: "#fff5f5", padding: "0.75rem", borderRadius: "6px" }}>{error}</p>}
        {success && <p style={{ color: "green", background: "#f0fff4", padding: "0.75rem", borderRadius: "6px" }}>{success}</p>}

        {/* Liste questions */}
        {questions.length === 0 && (
          <p style={{ color: "#718096" }}>Aucune question — créez le test sommatif !</p>
        )}

        {questions.map((q, index) => (
          <div key={q.id} style={{ background: "#f7fafc", padding: "1.25rem", borderRadius: "10px", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ background: typeQColor(q.type), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", marginRight: "0.5rem" }}>
                  {q.type}
                </span>
                <strong>Q{index + 1} : {q.texte}</strong>
                <span style={{ color: "#718096", fontSize: "0.85rem", marginLeft: "0.5rem" }}>
                  ({q.points} pt{q.points > 1 ? "s" : ""})
                </span>
              </div>
              <button onClick={() => handleDeleteQuestion(q.id)} style={btnDanger}>🗑</button>
            </div>

            {(q.type === "QCM" || q.type === "VRAI_FAUX") && (
              <ul style={{ marginTop: "0.5rem" }}>
                {q.choix.map((c, i) => (
                  <li key={i} style={{ color: c === q.reponse ? "#059669" : "#4a5568", fontWeight: c === q.reponse ? "bold" : "normal" }}>
                    {c === q.reponse ? "✅ " : "○ "}{c}
                  </li>
                ))}
              </ul>
            )}
            {q.type === "OUVERTE" && <p style={{ color: "#718096", fontStyle: "italic" }}>Réponse : {q.reponse}</p>}
            {q.type === "GAP"     && <p style={{ color: "#718096" }}>Réponses : {JSON.parse(q.reponse || "[]").join(", ")}</p>}
          </div>
        ))}

        {/* Formulaire nouvelle question */}
        {addingQ ? (
          <div style={{ background: "#eff6ff", padding: "1.25rem", borderRadius: "12px", marginTop: "1rem", border: "1px solid #bfdbfe" }}>
            <h3 style={{ margin: "0 0 1rem" }}>Nouvelle question</h3>

            <label style={labelStyle}>Type de question</label>
            <select value={questionType} onChange={(e) => { setQuestionType(e.target.value); setNewQuestion(emptyQuestion); }} style={inputStyle}>
              <option value="QCM">QCM — Une seule bonne réponse</option>
              <option value="QCM_MULTIPLE">QCM Multiple</option>
              <option value="VRAI_FAUX">Vrai / Faux</option>
              <option value="OUVERTE">Question ouverte</option>
              <option value="GAP">Texte à trous</option>
              <option value="MATCHING">Relier</option>
              <option value="ORDERING">Remettre en ordre</option>
            </select>

            <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Points</label>
            <input type="number" min="1" max="10" value={newQuestion.points}
              onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
              style={{ ...inputStyle, width: "80px" }}
            />

            {/* QCM */}
            {questionType === "QCM" && (
              <div style={{ marginTop: "0.75rem" }}>
                <label style={labelStyle}>Question *</label>
                <input placeholder="Question..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={inputStyle} />
                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Choix *</label>
                {newQuestion.choix.map((c, i) => (
                  <input key={i} placeholder={`Choix ${i + 1}`} value={c}
                    onChange={(e) => { const choix = [...newQuestion.choix]; choix[i] = e.target.value; setNewQuestion({ ...newQuestion, choix }); }}
                    style={{ ...inputStyle, marginBottom: "0.5rem" }} />
                ))}
                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Bonne réponse *</label>
                <select value={newQuestion.reponse} onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })} style={inputStyle}>
                  <option value="">Choisir</option>
                  {newQuestion.choix.filter((c) => c.trim()).map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {/* VRAI/FAUX */}
            {questionType === "VRAI_FAUX" && (
              <div style={{ marginTop: "0.75rem" }}>
                <label style={labelStyle}>Affirmation *</label>
                <input placeholder="Affirmation..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={inputStyle} />
                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Réponse correcte *</label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  {["Vrai", "Faux"].map((v) => (
                    <label key={v} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input type="radio" name="vf" value={v} checked={newQuestion.reponse === v} onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* OUVERTE */}
            {questionType === "OUVERTE" && (
              <div style={{ marginTop: "0.75rem" }}>
                <label style={labelStyle}>Question *</label>
                <textarea placeholder="Question..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={{ ...inputStyle, height: "80px", resize: "vertical" }} />
                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Réponse modèle *</label>
                <textarea placeholder="Réponse attendue..." value={newQuestion.reponse} onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })} style={{ ...inputStyle, height: "80px", resize: "vertical" }} />
              </div>
            )}

            {/* GAP */}
            {questionType === "GAP" && (
              <div style={{ marginTop: "0.75rem" }}>
                <label style={labelStyle}>Texte à trous * — utilisez [trou]</label>
                <textarea placeholder="La capitale de [trou] est [trou]" value={newQuestion.texteTrous} onChange={(e) => setNewQuestion({ ...newQuestion, texteTrous: e.target.value })} style={{ ...inputStyle, height: "80px", resize: "vertical" }} />
                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Réponses séparées par virgules *</label>
                <input placeholder="France, Paris" value={newQuestion.reponse} onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })} style={inputStyle} />
              </div>
            )}

            {/* MATCHING */}
            {questionType === "MATCHING" && (
              <div style={{ marginTop: "0.75rem" }}>
                <label style={labelStyle}>Question *</label>
                <input placeholder="Question..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={inputStyle} />
                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Paires *</label>
                {newQuestion.paires.map((p, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <input placeholder={`Élément ${i + 1}`} value={p.gauche} onChange={(e) => { const paires = [...newQuestion.paires]; paires[i] = { ...paires[i], gauche: e.target.value }; setNewQuestion({ ...newQuestion, paires }); }} style={inputStyle} />
                    <span style={{ textAlign: "center", lineHeight: "2.5" }}>→</span>
                    <input placeholder={`Correspondance ${i + 1}`} value={p.droite} onChange={(e) => { const paires = [...newQuestion.paires]; paires[i] = { ...paires[i], droite: e.target.value }; setNewQuestion({ ...newQuestion, paires }); }} style={inputStyle} />
                  </div>
                ))}
                <button onClick={() => setNewQuestion({ ...newQuestion, paires: [...newQuestion.paires, { gauche: "", droite: "" }] })} style={{ ...btnSmall, marginTop: "0.5rem" }}>➕ Paire</button>
              </div>
            )}

            {/* ORDERING */}
            {questionType === "ORDERING" && (
              <div style={{ marginTop: "0.75rem" }}>
                <label style={labelStyle}>Question *</label>
                <input placeholder="Question..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={inputStyle} />
                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Éléments dans le bon ordre *</label>
                {newQuestion.elements.map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#718096", minWidth: "20px", lineHeight: "2.5" }}>{i + 1}.</span>
                    <input placeholder={`Élément ${i + 1}`} value={e} onChange={(ev) => { const elements = [...newQuestion.elements]; elements[i] = ev.target.value; setNewQuestion({ ...newQuestion, elements }); }} style={inputStyle} />
                  </div>
                ))}
                <button onClick={() => setNewQuestion({ ...newQuestion, elements: [...newQuestion.elements, ""] })} style={{ ...btnSmall, marginTop: "0.5rem" }}>➕ Élément</button>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
              <button onClick={handleAddQuestion} style={btnSuccess}>✅ Ajouter</button>
              <button onClick={() => { setAddingQ(false); setNewQuestion(emptyQuestion); }} style={btnWarning}>Annuler</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button onClick={() => setAddingQ(true)} style={btnPrimary}>
              ➕ Ajouter une question
            </button>
            {questions.length > 0 && (
              <button onClick={handleDeleteQuiz} style={{ ...btnDanger, padding: "0.75rem 1.5rem" }}>
                🗑 Vider le test sommatif
              </button>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function typeQColor(type) {
  const colors = { QCM: "#1e40af", QCM_MULTIPLE: "#7c3aed", VRAI_FAUX: "#059669", OUVERTE: "#d97706", GAP: "#0d9488", MATCHING: "#dc2626", ORDERING: "#0ea5e9" };
  return colors[type] || "#475569";
}

const btnBack    = { background: "none", border: "none", color: "#f97316", cursor: "pointer", marginBottom: "1rem", fontSize: "0.95rem", fontWeight: "600" };
const btnPrimary = { background: "linear-gradient(135deg,#1e3a5f,#1e40af)", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 12px rgba(30,64,175,0.3)" };
const btnSuccess = { background: "linear-gradient(135deg,#065f46,#059669)", color: "white", padding: "0.5rem 1.2rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const btnWarning = { background: "linear-gradient(135deg,#92400e,#d97706)", color: "white", padding: "0.5rem 1.2rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const btnDanger  = { background: "linear-gradient(135deg,#991b1b,#dc2626)", color: "white", padding: "0.3rem 0.8rem", border: "none", borderRadius: "8px", cursor: "pointer" };
const btnSmall   = { background: "linear-gradient(135deg,#facc15,#f97316)", color: "white", padding: "0.3rem 0.9rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" };
const inputStyle = { width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "8px", fontSize: "1rem", boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: "0.3rem", fontWeight: "600", color: "#4a5568" };