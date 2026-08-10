import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ManageChapter() {
  const router = useRouter();
  const { id, chapterId } = router.query;

  const [chapter,  setChapter]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [tab,      setTab]      = useState("supports");

  // Supports
  const [newSupport,    setNewSupport]    = useState({ type: "PDF", url: "", nom: "" });
  const [addingSupport, setAddingSupport] = useState(false);

  // Quiz
  const [questions,     setQuestions]     = useState([]);
  const [addingQuestion,setAddingQuestion]= useState(false);
  const [questionType,  setQuestionType]  = useState("QCM");
  const [saving,        setSaving]        = useState(false);

  const emptyQuestion = {
    texte: "", choix: ["", "", "", ""], reponse: "", points: 1,
    texteTrous: "", paires: [{ gauche: "", droite: "" }, { gauche: "", droite: "" }],
    elements: ["", "", "", ""], reponsesMultiples: [],
  };
  const [newQuestion, setNewQuestion] = useState(emptyQuestion);

  useEffect(() => {
    if (!chapterId) return;
    fetchChapter();
  }, [chapterId]);

  const fetchChapter = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/chapters/${chapterId}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Erreur chargement");
      setChapter(data);
      setQuestions(data.quiz?.questions || []);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  // ── Supports ──────────────────────────────────────────────────────
  const handleAddSupport = async () => {
    if (!newSupport.url) return setError("URL obligatoire");
    setError(""); setSuccess("");
    try {
      const res = await fetch("/api/supports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...newSupport, chapterId }),
      });
      if (res.ok) {
        setSuccess("✅ Support ajouté !");
        setNewSupport({ type: "PDF", url: "", nom: "" });
        setAddingSupport(false);
        fetchChapter();
      } else {
        const d = await res.json();
        setError(d.error || "Erreur ajout support");
      }
    } catch { setError("Erreur serveur"); }
  };

  const handleDeleteSupport = async (supportId) => {
    if (!confirm("Supprimer ce support ?")) return;
    try {
      await fetch("/api/supports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ supportId }),
      });
      fetchChapter();
    } catch { setError("Erreur serveur"); }
  };

  // ── Quiz ──────────────────────────────────────────────────────────
  const resetQuestion = () => {
    setNewQuestion(emptyQuestion);
    setQuestionType("QCM");
  };

  const handleAddQuestion = async () => {
    setError(""); setSuccess("");
    setSaving(true);

    let payload = {
      chapterId,
      type:   questionType,
      texte:  newQuestion.texte.trim(),
      points: newQuestion.points,
    };

    // ── Validation + construction payload selon type ──
    switch (questionType) {

      case "QCM": {
        const choix = newQuestion.choix.filter((c) => c.trim());
        if (!payload.texte)
          return finish("La question est obligatoire");
        if (choix.length < 2)
          return finish("Ajoutez au moins 2 choix");
        if (!newQuestion.reponse)
          return finish("Sélectionnez la bonne réponse");
        if (!choix.includes(newQuestion.reponse))
          return finish("La bonne réponse doit être l'un des choix");
        payload.choix   = choix;
        payload.reponse = newQuestion.reponse;
        break;
      }

      case "QCM_MULTIPLE": {
        const choix  = newQuestion.choix.filter((c) => c.trim());
        // On filtre les bonnes réponses qui sont dans les choix remplis
        const bonnes = newQuestion.reponsesMultiples.filter((r) => r.trim() && choix.includes(r));
        if (!payload.texte)
          return finish("La question est obligatoire");
        if (choix.length < 2)
          return finish("Ajoutez au moins 2 choix");
        if (bonnes.length < 1)
          return finish("Cochez au moins une bonne réponse");
        payload.choix   = choix;
        payload.reponse = JSON.stringify(bonnes);
        break;
      }

      case "VRAI_FAUX": {
        if (!payload.texte)
          return finish("L'affirmation est obligatoire");
        if (!newQuestion.reponse)
          return finish("Sélectionnez Vrai ou Faux");
        payload.choix   = ["Vrai", "Faux"];
        payload.reponse = newQuestion.reponse;
        break;
      }

      case "OUVERTE": {
        if (!payload.texte)
          return finish("La question est obligatoire");
        if (!newQuestion.reponse.trim())
          return finish("La réponse modèle est obligatoire");
        payload.choix   = [];
        payload.reponse = newQuestion.reponse.trim();
        break;
      }

      case "GAP": {
        const texte = newQuestion.texteTrous.trim();
        if (!texte)
          return finish("Le texte à trous est obligatoire");
        const trous = (texte.match(/\[trou\]/gi) || []).length;
        if (trous === 0)
          return finish("Ajoutez au moins un [trou] dans le texte");
        if (!newQuestion.reponse.trim())
          return finish("Les réponses sont obligatoires");
        const reponses = newQuestion.reponse.split(",").map((r) => r.trim()).filter(Boolean);
        if (reponses.length !== trous)
          return finish(`Vous avez ${trous} trou(s) mais ${reponses.length} réponse(s)`);
        payload.texte   = texte;
        payload.choix   = [];
        payload.reponse = JSON.stringify(reponses);
        break;
      }

      case "MATCHING": {
        const paires = newQuestion.paires.filter((p) => p.gauche.trim() && p.droite.trim());
        if (!payload.texte)
          return finish("La question est obligatoire");
        if (paires.length < 2)
          return finish("Ajoutez au moins 2 paires complètes");
        payload.choix   = paires.map((p) => p.gauche);
        payload.reponse = JSON.stringify(
          paires.reduce((acc, p) => ({ ...acc, [p.gauche]: p.droite }), {})
        );
        break;
      }

      case "ORDERING": {
        const elements = newQuestion.elements.filter((e) => e.trim());
        if (!payload.texte)
          return finish("La question est obligatoire");
        if (elements.length < 2)
          return finish("Ajoutez au moins 2 éléments");
        payload.choix   = [...elements].sort(() => Math.random() - 0.5);
        payload.reponse = JSON.stringify(elements);
        break;
      }

      default:
        return finish("Type de question invalide");
    }

    // ── Envoi API ──
    try {
      const res = await fetch("/api/quiz/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Question ajoutée !");
        resetQuestion();
        setAddingQuestion(false);
        fetchChapter();
      } else {
        setError(data.error || "Erreur lors de l'ajout");
      }
    } catch {
      setError("Erreur serveur — vérifiez votre connexion");
    } finally {
      setSaving(false);
    }
  };

  // Helper pour arrêter le saving et afficher l'erreur
  const finish = (msg) => {
    setError(msg);
    setSaving(false);
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
      fetchChapter();
    } catch { setError("Erreur serveur"); }
  };

  if (loading) return <p style={{ padding: "2rem" }}>Chargement...</p>;
  if (!chapter) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>

        <button onClick={() => router.push(`/dashboard/designer/courses/${id}`)} style={btnBack}>
          ← Retour au cours
        </button>

        <h1>📖 {chapter?.title}</h1>
        {chapter?.objectifs && (
          <div
            className="rich-content"
            dangerouslySetInnerHTML={{ __html: chapter.objectifs }}
            style={{ color: "#718096", lineHeight: "1.6", margin: "0.25rem 0 0.75rem" }}
          />
        )}

        {error   && <p style={{ color: "red",   background: "#fff5f5", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>{error}</p>}
        {success && <p style={{ color: "green", background: "#f0fff4", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>{success}</p>}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid #e2e8f0" }}>
          {[
            { key: "supports", label: `📎 Supports (${chapter?.supports?.length || 0})` },
            { key: "quiz",     label: `📝 Quiz formatif (${questions.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "0.6rem 1.2rem", border: "none", cursor: "pointer", background: "none",
              borderBottom: tab === t.key ? "3px solid #3182ce" : "3px solid transparent",
              color: tab === t.key ? "#3182ce" : "#718096",
              fontWeight: tab === t.key ? "bold" : "normal",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Supports ── */}
        {tab === "supports" && (
          <div>
            {chapter?.supports?.length === 0 && (
              <p style={{ color: "#718096" }}>Aucun support — ajoutez des ressources pédagogiques !</p>
            )}
            {chapter?.supports?.map((s) => (
              <div key={s.id} style={{ background: "#f7fafc", padding: "1rem", borderRadius: "10px", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ background: typeColor(s.type), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem", marginRight: "0.5rem" }}>
                    {s.type}
                  </span>
                  <strong>{s.nom || s.url}</strong>
                  <div style={{ fontSize: "0.8rem", color: "#718096", marginTop: "0.25rem" }}>
                    <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "#3182ce" }}>{s.url}</a>
                  </div>
                </div>
                <button onClick={() => handleDeleteSupport(s.id)} style={btnDanger}>🗑</button>
              </div>
            ))}

            {addingSupport ? (
              <div style={{ background: "#ebf8ff", padding: "1.25rem", borderRadius: "10px", marginTop: "1rem" }}>
                <h3 style={{ margin: "0 0 1rem" }}>Ajouter un support</h3>

                <label style={labelStyle}>Type de support</label>
                <select value={newSupport.type} onChange={(e) => setNewSupport({ ...newSupport, type: e.target.value })} style={inputStyle}>
                  {["PDF", "VIDEO", "IMAGE", "PPT", "SCORM", "ARTICULATE"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Nom affiché</label>
                <input placeholder="Ex: Cours chapitre 1" value={newSupport.nom} onChange={(e) => setNewSupport({ ...newSupport, nom: e.target.value })} style={inputStyle} />

                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>URL / Lien *</label>
                <input placeholder="https://..." value={newSupport.url} onChange={(e) => setNewSupport({ ...newSupport, url: e.target.value })} style={inputStyle} />

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button onClick={handleAddSupport} style={btnSuccess}>✅ Ajouter</button>
                  <button onClick={() => setAddingSupport(false)} style={btnWarning}>Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingSupport(true)} style={{ ...btnPrimary, marginTop: "1rem" }}>
                ➕ Ajouter un support
              </button>
            )}
          </div>
        )}

        {/* ── Tab Quiz ── */}
        {tab === "quiz" && (
          <div>
            {questions.length === 0 && !addingQuestion && (
              <p style={{ color: "#718096" }}>Aucune question — créez le quiz formatif !</p>
            )}

            {/* Liste questions existantes */}
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
                  <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
                    {q.choix.map((c, i) => (
                      <li key={i} style={{ color: c === q.reponse ? "#38a169" : "#4a5568", fontWeight: c === q.reponse ? "bold" : "normal" }}>
                        {c === q.reponse ? "✅ " : "○ "}{c}
                      </li>
                    ))}
                  </ul>
                )}
                {q.type === "QCM_MULTIPLE" && (() => {
                  let bonnes = [];
                  try { bonnes = JSON.parse(q.reponse || "[]"); } catch {}
                  return (
                    <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
                      {q.choix.map((c, i) => (
                        <li key={i} style={{ color: bonnes.includes(c) ? "#38a169" : "#4a5568", fontWeight: bonnes.includes(c) ? "bold" : "normal" }}>
                          {bonnes.includes(c) ? "✅ " : "☐ "}{c}
                        </li>
                      ))}
                    </ul>
                  );
                })()}
                {q.type === "OUVERTE" && (
                  <p style={{ color: "#718096", marginTop: "0.5rem", fontStyle: "italic" }}>
                    💡 Réponse modèle : {q.reponse}
                  </p>
                )}
                {q.type === "GAP" && (() => {
                  let rep = [];
                  try { rep = JSON.parse(q.reponse || "[]"); } catch {}
                  return <p style={{ color: "#718096", marginTop: "0.5rem" }}>Réponses : {rep.join(", ")}</p>;
                })()}
                {q.type === "MATCHING" && (() => {
                  let pairs = {};
                  try { pairs = JSON.parse(q.reponse || "{}"); } catch {}
                  return (
                    <div style={{ marginTop: "0.5rem" }}>
                      {Object.entries(pairs).map(([g, d], i) => (
                        <div key={i} style={{ color: "#4a5568" }}>🔗 {g} → {String(d)}</div>
                      ))}
                    </div>
                  );
                })()}
                {q.type === "ORDERING" && (() => {
                  let elems = [];
                  try { elems = JSON.parse(q.reponse || "[]"); } catch {}
                  return (
                    <ol style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
                      {elems.map((e, i) => <li key={i} style={{ color: "#4a5568" }}>{e}</li>)}
                    </ol>
                  );
                })()}
              </div>
            ))}

            {/* Formulaire nouvelle question */}
            {addingQuestion ? (
              <div style={{ background: "#ebf8ff", padding: "1.25rem", borderRadius: "10px", marginTop: "1rem" }}>
                <h3 style={{ margin: "0 0 1rem" }}>Nouvelle question</h3>

                {/* Type */}
                <label style={labelStyle}>Type de question</label>
                <select
                  value={questionType}
                  onChange={(e) => { setQuestionType(e.target.value); setNewQuestion(emptyQuestion); setError(""); }}
                  style={inputStyle}
                >
                  <option value="QCM">QCM — Une seule bonne réponse</option>
                  <option value="QCM_MULTIPLE">QCM Multiple — Plusieurs bonnes réponses</option>
                  <option value="VRAI_FAUX">Vrai / Faux</option>
                  <option value="OUVERTE">Question ouverte</option>
                  <option value="GAP">Texte à trous (Fill the gap)</option>
                  <option value="MATCHING">Relier (Matching)</option>
                  <option value="ORDERING">Remettre en ordre</option>
                </select>

                {/* Points */}
                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Points</label>
                <input
                  type="number" min="1" max="10"
                  value={newQuestion.points}
                  onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
                  style={{ ...inputStyle, width: "80px" }}
                />

                {/* ── QCM ── */}
                {questionType === "QCM" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Question *</label>
                    <input
                      placeholder="Quelle est la question ?"
                      value={newQuestion.texte}
                      onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })}
                      style={inputStyle}
                    />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Choix de réponses *</label>
                    {newQuestion.choix.map((c, i) => (
                      <input key={i} placeholder={`Choix ${i + 1}`} value={c}
                        onChange={(e) => {
                          const choix = [...newQuestion.choix];
                          choix[i] = e.target.value;
                          // Si ce choix était la bonne réponse, on réinitialise
                          const reponse = newQuestion.reponse === newQuestion.choix[i] ? "" : newQuestion.reponse;
                          setNewQuestion({ ...newQuestion, choix, reponse });
                        }}
                        style={{ ...inputStyle, marginBottom: "0.5rem" }}
                      />
                    ))}
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Bonne réponse *</label>
                    <select
                      value={newQuestion.reponse}
                      onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">— Choisir la bonne réponse —</option>
                      {newQuestion.choix.filter((c) => c.trim()).map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* ── QCM MULTIPLE ── */}
                {questionType === "QCM_MULTIPLE" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Question *</label>
                    <input
                      placeholder="Quelle est la question ?"
                      value={newQuestion.texte}
                      onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })}
                      style={inputStyle}
                    />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Choix — cochez les bonnes réponses *</label>
                    {newQuestion.choix.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <input
                          type="checkbox"
                          checked={newQuestion.reponsesMultiples.includes(c) && c.trim() !== ""}
                          onChange={(e) => {
                            if (!c.trim()) return; // ignorer si le champ est vide
                            const rep = [...newQuestion.reponsesMultiples];
                            if (e.target.checked) { if (!rep.includes(c)) rep.push(c); }
                            else rep.splice(rep.indexOf(c), 1);
                            setNewQuestion({ ...newQuestion, reponsesMultiples: rep });
                          }}
                          disabled={!c.trim()}
                        />
                        <input
                          placeholder={`Choix ${i + 1}`}
                          value={c}
                          onChange={(e) => {
                            const choix = [...newQuestion.choix];
                            const old = choix[i];
                            choix[i] = e.target.value;
                            // Mettre à jour reponsesMultiples si ce choix était coché
                            const rep = newQuestion.reponsesMultiples.map((r) => r === old ? e.target.value : r).filter((r) => r.trim());
                            setNewQuestion({ ...newQuestion, choix, reponsesMultiples: rep });
                          }}
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── VRAI/FAUX ── */}
                {questionType === "VRAI_FAUX" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Affirmation *</label>
                    <input
                      placeholder="Entrez une affirmation..."
                      value={newQuestion.texte}
                      onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })}
                      style={inputStyle}
                    />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Réponse correcte *</label>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                      {["Vrai", "Faux"].map((v) => (
                        <label key={v} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "1rem" }}>
                          <input
                            type="radio" name="vf" value={v}
                            checked={newQuestion.reponse === v}
                            onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })}
                          />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── OUVERTE ── */}
                {questionType === "OUVERTE" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Question *</label>
                    <textarea
                      placeholder="Posez votre question..."
                      value={newQuestion.texte}
                      onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })}
                      style={{ ...inputStyle, height: "80px", resize: "vertical" }}
                    />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Réponse modèle *</label>
                    <textarea
                      placeholder="Réponse attendue (sera montrée à l'apprenant après correction)..."
                      value={newQuestion.reponse}
                      onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })}
                      style={{ ...inputStyle, height: "80px", resize: "vertical" }}
                    />
                  </div>
                )}

                {/* ── GAP ── */}
                {questionType === "GAP" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Texte à trous * — utilisez [trou] pour chaque trou</label>
                    <textarea
                      placeholder="Ex: La capitale de la France est [trou] et sa monnaie est [trou]"
                      value={newQuestion.texteTrous}
                      onChange={(e) => setNewQuestion({ ...newQuestion, texteTrous: e.target.value })}
                      style={{ ...inputStyle, height: "100px", resize: "vertical" }}
                    />
                    {newQuestion.texteTrous && (
                      <p style={{ color: "#3182ce", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {(newQuestion.texteTrous.match(/\[trou\]/gi) || []).length} trou(s) détecté(s)
                      </p>
                    )}
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Réponses dans l'ordre, séparées par des virgules *</label>
                    <input
                      placeholder="Ex: Paris, Euro"
                      value={newQuestion.reponse}
                      onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* ── MATCHING ── */}
                {questionType === "MATCHING" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Question *</label>
                    <input
                      placeholder="Reliez chaque élément à sa correspondance"
                      value={newQuestion.texte}
                      onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })}
                      style={inputStyle}
                    />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Paires à relier *</label>
                    {newQuestion.paires.map((p, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                        <input
                          placeholder={`Élément ${i + 1}`} value={p.gauche}
                          onChange={(e) => { const paires = [...newQuestion.paires]; paires[i] = { ...paires[i], gauche: e.target.value }; setNewQuestion({ ...newQuestion, paires }); }}
                          style={inputStyle}
                        />
                        <span style={{ textAlign: "center", color: "#718096" }}>→</span>
                        <input
                          placeholder={`Correspondance ${i + 1}`} value={p.droite}
                          onChange={(e) => { const paires = [...newQuestion.paires]; paires[i] = { ...paires[i], droite: e.target.value }; setNewQuestion({ ...newQuestion, paires }); }}
                          style={inputStyle}
                        />
                        {newQuestion.paires.length > 2 && (
                          <button
                            onClick={() => setNewQuestion({ ...newQuestion, paires: newQuestion.paires.filter((_, idx) => idx !== i) })}
                            style={{ ...btnDanger, padding: "0.3rem 0.5rem" }}
                          >✕</button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setNewQuestion({ ...newQuestion, paires: [...newQuestion.paires, { gauche: "", droite: "" }] })}
                      style={{ ...btnSmall, marginTop: "0.5rem" }}
                    >➕ Ajouter une paire</button>
                  </div>
                )}

                {/* ── ORDERING ── */}
                {questionType === "ORDERING" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Question *</label>
                    <input
                      placeholder="Remettez les éléments dans le bon ordre"
                      value={newQuestion.texte}
                      onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })}
                      style={inputStyle}
                    />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Éléments dans le bon ordre *</label>
                    {newQuestion.elements.map((e, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ color: "#718096", minWidth: "20px" }}>{i + 1}.</span>
                        <input
                          placeholder={`Élément ${i + 1}`} value={e}
                          onChange={(ev) => { const elements = [...newQuestion.elements]; elements[i] = ev.target.value; setNewQuestion({ ...newQuestion, elements }); }}
                          style={inputStyle}
                        />
                        {newQuestion.elements.length > 2 && (
                          <button
                            onClick={() => setNewQuestion({ ...newQuestion, elements: newQuestion.elements.filter((_, idx) => idx !== i) })}
                            style={{ ...btnDanger, padding: "0.3rem 0.5rem" }}
                          >✕</button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setNewQuestion({ ...newQuestion, elements: [...newQuestion.elements, ""] })}
                      style={{ ...btnSmall, marginTop: "0.5rem" }}
                    >➕ Ajouter un élément</button>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                  <button
                    onClick={handleAddQuestion}
                    disabled={saving}
                    style={{ ...btnSuccess, opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? "⏳ Sauvegarde..." : "✅ Ajouter la question"}
                  </button>
                  <button
                    onClick={() => { setAddingQuestion(false); resetQuestion(); setError(""); }}
                    style={btnWarning}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setAddingQuestion(true); setError(""); setSuccess(""); }} style={{ ...btnPrimary, marginTop: "1rem" }}>
                ➕ Ajouter une question
              </button>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function typeColor(type) {
  const colors = { PDF: "#e53e3e", VIDEO: "#3182ce", IMAGE: "#38a169", PPT: "#dd6b20", SCORM: "#805ad5", ARTICULATE: "#d69e2e" };
  return colors[type] || "#718096";
}

function typeQColor(type) {
  const colors = { QCM: "#3182ce", QCM_MULTIPLE: "#805ad5", VRAI_FAUX: "#38a169", OUVERTE: "#dd6b20", GAP: "#d69e2e", MATCHING: "#e53e3e", ORDERING: "#319795" };
  return colors[type] || "#718096";
}

const btnBack    = { background: "none", border: "none", color: "#3182ce", cursor: "pointer", marginBottom: "1rem", fontSize: "0.95rem" };
const btnPrimary = { background: "#3182ce", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "8px", cursor: "pointer" };
const btnSuccess = { background: "#38a169", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnWarning = { background: "#dd6b20", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnDanger  = { background: "#e53e3e", color: "white", padding: "0.3rem 0.7rem", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnSmall   = { background: "#3182ce", color: "white", padding: "0.3rem 0.8rem", border: "none", borderRadius: "6px", cursor: "pointer" };
const inputStyle = { width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: "0.3rem", fontWeight: "600", color: "#4a5568" };
