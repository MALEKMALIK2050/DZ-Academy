import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RichEditor from "@/components/RichEditor";

export default function ManageChapter() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, chapterId } = router.query;

  const [chapter,  setChapter]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [tab,      setTab]      = useState("supports");

  // Supports
  const [newSupport,    setNewSupport]    = useState({ type: "PDF", url: "", nom: "", contenu: "" });
  const [addingSupport, setAddingSupport] = useState(false);
  const [editingSupport, setEditingSupport] = useState(null);
  const [editSupport, setEditSupport] = useState({ nom: "", url: "", contenu: "" });
  const [scormFile, setScormFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Devoirs
  const [devoirs,      setDevoirs]      = useState([]);
  const [addingDevoir, setAddingDevoir] = useState(false);
  const [newDevoir,    setNewDevoir]    = useState({ titre: "", consigne: "", dateLimit: "" });

  // Quiz
  const [questions,     setQuestions]     = useState([]);
  const [addingQuestion,setAddingQuestion]= useState(false);
  const [questionType,  setQuestionType]  = useState("QCM");

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

  // ── fetchChapter ─────────────────────────────────────────
  const fetchChapter = async () => {
    try {
      const [chRes, dvRes] = await Promise.all([
        fetch(`/api/chapters/${chapterId}`, { credentials: "include" }),
        fetch(`/api/devoirs?chapterId=${chapterId}`, { credentials: "include" }),
      ]);
      const chData = await chRes.json();
      const dvData = await dvRes.json();

      if (!chRes.ok) return setError(chData.error || "Erreur chargement");
      setChapter(chData);
      setQuestions(chData.quiz?.questions || []);
      setDevoirs(Array.isArray(dvData) ? dvData : []);
    } catch { setError("Erreur serveur"); }
    finally { setLoading(false); }
  };


  const handleMoveSupport = async (supportId, direction) => {
  const sorted   = [...chapter.supports].sort((a, b) => a.ordre - b.ordre);
  const index    = sorted.findIndex((s) => s.id === supportId);
  const newIndex = direction === "up" ? index - 1 : index + 1;

  if (newIndex < 0 || newIndex >= sorted.length) return;

  const current = sorted[index];
  const target  = sorted[newIndex];

  await Promise.all([
    fetch("/api/supports", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ supportId: current.id, ordre: target.ordre }),
    }),
    fetch("/api/supports", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ supportId: target.id, ordre: current.ordre }),
    }),
  ]);

  fetchChapter();
};

  // ── Supports ─────────────────────────────────────────────
const isScormType = (type) => type === "SCORM" || type === "ARTICULATE";

const handleAddSupport = async () => {
  // Validation spécifique selon le type
  if (isScormType(newSupport.type)) {
    if (!scormFile) return setError("Fichier ZIP obligatoire");
    if (!newSupport.nom) return setError("Nom affiché obligatoire");
  } else if (newSupport.type !== "TEXTE" && newSupport.type !== "FORUM" && !newSupport.url) {
    return setError("URL obligatoire");
  }
  if ((newSupport.type === "TEXTE" || newSupport.type === "FORUM") && !newSupport.contenu) return setError("Contenu obligatoire");
  setError(""); setSuccess("");

  // ── Upload SCORM/ARTICULATE via multipart ──
  if (isScormType(newSupport.type)) {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("scormFile", scormFile);
    formData.append("chapterId", chapterId);
    formData.append("type", newSupport.type);
    formData.append("nom", newSupport.nom);

    try {
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/supports/upload-scorm");
        xhr.withCredentials = true;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else reject(new Error(data.error || "Erreur upload"));
          } catch { reject(new Error("Réponse invalide")); }
        };

        xhr.onerror = () => reject(new Error("Erreur réseau"));
        xhr.send(formData);
      });

      setSuccess("✅ Package " + newSupport.type + " importé avec succès !");
      setNewSupport({ type: "PDF", url: "", nom: "", contenu: "" });
      setScormFile(null);
      setAddingSupport(false);
      fetchChapter();
    } catch (err) {
      setError(err.message || "Erreur upload");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
    return;
  }

  // ── Upload standard (URL-based) ──
  try {
    const res = await fetch("/api/supports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...newSupport, chapterId }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setSuccess("✅ Support ajouté !");
      setNewSupport({ type: "PDF", url: "", nom: "", contenu: "" });
      setAddingSupport(false);
      fetchChapter();
    } else {
      setError(data.error || "Erreur ajout support");
    }
  } catch { setError("Erreur serveur"); }
};





























  const handleUpdateSupport = async () => {
  setError(""); setSuccess("");
  try {
    const res = await fetch("/api/supports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        supportId: editingSupport,
        nom:     editSupport.nom,
        url:     editSupport.url,
        contenu: editSupport.contenu,
      }),
    });
    if (res.ok) {
      setSuccess("✅ Support mis à jour !");
      setEditingSupport(null);
      fetchChapter();
    } else {
      const d = await res.json();
      setError(d.error || "Erreur modification");
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

  // ── Devoirs ───────────────────────────────────────────────
  const handleAddDevoir = async () => {
    if (!newDevoir.titre || !newDevoir.consigne || !newDevoir.dateLimit)
      return setError("Titre, consigne et date limite sont obligatoires");
    setError(""); setSuccess("");

    try {
      const res = await fetch("/api/devoirs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chapterId, ...newDevoir }),
      });
      if (res.ok) {
        setSuccess("✅ Devoir créé !");
        setNewDevoir({ titre: "", consigne: "", dateLimit: "" });
        setAddingDevoir(false);
        fetchChapter();
      } else {
        const d = await res.json();
        setError(d.error || "Erreur création devoir");
      }
    } catch { setError("Erreur serveur"); }
  };

  const handleDeleteDevoir = async (devoirId) => {
    if (!confirm("Supprimer ce devoir ?")) return;
    try {
      await fetch("/api/devoirs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ devoirId }),
      });
      fetchChapter();
    } catch {}
  };

  // ── Quiz ─────────────────────────────────────────────────
  const resetQuestion = () => { setNewQuestion(emptyQuestion); setQuestionType("QCM"); };

  const handleAddQuestion = async () => {
    setError(""); setSuccess("");
    let payload = { chapterId, type: questionType, texte: newQuestion.texte, points: newQuestion.points };

    switch (questionType) {
      case "QCM": {
        const choix = newQuestion.choix.filter((c) => c.trim());
        if (!newQuestion.texte || choix.length < 2 || !newQuestion.reponse)
          return setError("Question, au moins 2 choix et bonne réponse obligatoires");
        payload.choix = choix; payload.reponse = newQuestion.reponse; break;
      }
      case "QCM_MULTIPLE": {
        const choix  = newQuestion.choix.filter((c) => c.trim());
        const bonnes = newQuestion.reponsesMultiples.filter((r) => r.trim());
        if (!newQuestion.texte || choix.length < 2 || bonnes.length < 1)
          return setError("Au moins 2 choix et 1 bonne réponse obligatoires");
        payload.choix = choix; payload.reponse = JSON.stringify(bonnes); break;
      }
      case "VRAI_FAUX": {
        if (!newQuestion.texte || !newQuestion.reponse) return setError("Affirmation et réponse obligatoires");
        payload.choix = ["Vrai", "Faux"]; payload.reponse = newQuestion.reponse; break;
      }
      case "OUVERTE": {
        if (!newQuestion.texte || !newQuestion.reponse) return setError("Question et réponse modèle obligatoires");
        payload.choix = []; payload.reponse = newQuestion.reponse; break;
      }
      case "GAP": {
        if (!newQuestion.texteTrous) return setError("Texte à trous obligatoire");
        const trous = (newQuestion.texteTrous.match(/\[trou\]/gi) || []).length;
        if (trous === 0) return setError("Ajoutez au moins un [trou]");
        payload.texte = newQuestion.texteTrous; payload.choix = [];
        payload.reponse = JSON.stringify(newQuestion.reponse.split(",").map((r) => r.trim())); break;
      }
      case "MATCHING": {
        const paires = newQuestion.paires.filter((p) => p.gauche.trim() && p.droite.trim());
        if (!newQuestion.texte || paires.length < 2) return setError("Au moins 2 paires obligatoires");
        payload.choix   = paires.map((p) => p.gauche);
        payload.reponse = JSON.stringify(paires.reduce((acc, p) => ({ ...acc, [p.gauche]: p.droite }), {})); break;
      }
      case "ORDERING": {
        const elements = newQuestion.elements.filter((e) => e.trim());
        if (!newQuestion.texte || elements.length < 2) return setError("Au moins 2 éléments obligatoires");
        payload.choix   = [...elements].sort(() => Math.random() - 0.5);
        payload.reponse = JSON.stringify(elements); break;
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
        resetQuestion(); setAddingQuestion(false); fetchChapter();
      } else {
        const d = await res.json();
        setError(d.error || "Erreur ajout question");
      }
    } catch { setError("Erreur serveur"); }
  };

  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace Designer", icon: "🎨" },
    { key: "courses",  label: "Mes cours",       icon: "📚" },
    { key: "messages", label: "Messages",        icon: "✉️" },
  ];

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement du chapitre...</div>;

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎨"
        customTitle={`Gérer Chapitre: ${chapter?.title}`}
        tabs={DASHBOARD_TABS}
        activeTab="courses"
        onTabChange={(t) => router.push("/dashboard/designer")}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}></div>
          
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "2rem",
            background: "white",
            padding: "1.5rem 2rem",
            borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            border: "1px solid #edf2f7"
          }}>
            <div>
              <button onClick={() => router.push(`/dashboard/designer/courses/${id}`)} style={{ ...btnBack, marginBottom: "0.5rem" }}>
                ← Retour au cours
              </button>
              <h1 style={{ 
                margin: 0, 
                fontSize: "2.2rem", 
                fontWeight: "800",
                background: "linear-gradient(135deg, #059669, #10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                Chapitre : {chapter?.title}
              </h1>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span style={{ background: "#edf2f7", color: "#4a5568", padding: "0.4rem 1rem", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "600" }}>
                {chapter?.supports?.length || 0} Support(s)
              </span>
            </div>
          </div>

          {error && <div style={{ background: "#fff5f5", color: "#e53e3e", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #fed7d7" }}>❌ {error}</div>}
          {success && <div style={{ background: "#f0fff4", color: "#059669", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #c6f6d5" }}>✅ {success}</div>}

          {/* Onglets */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid #edf2f7" }}>
            {[
              { key: "supports", label: `📎 Supports (${chapter?.supports?.length || 0})` },
              { key: "quiz",     label: `📝 Quiz formatif (${questions.length})` },
              { key: "devoirs",  label: `📋 Devoirs (${devoirs.length})` },
            ].map(t => (
              <button 
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "0.8rem 1.5rem",
                  border: "none",
                  background: "transparent",
                  fontSize: "1rem",
                  fontWeight: tab === t.key ? "700" : "500",
                  color: tab === t.key ? "#3182ce" : "#718096",
                  borderBottom: tab === t.key ? "3px solid #3182ce" : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginBottom: "-2px"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.02)", border: "1px solid #edf2f7", minHeight: "500px" }}>

        {/* ── Tab Supports ── */}
        {tab === "supports" && (
          <div>
            {chapter?.supports?.length === 0 && (
              <p style={{ color: "#718096" }}>Aucun support — ajoutez des ressources pédagogiques !</p>
            )}

            {chapter?.supports?.sort((a, b) => a.ordre - b.ordre).map((s, index) => (
              <div key={s.id}>
                {editingSupport === s.id ? (
                  // ── Mode édition ──
                  <div style={{ background: "#eff6ff", padding: "1.25rem", borderRadius: "12px", marginBottom: "0.75rem", border: "1px solid #bfdbfe" }}>
                    <h4 style={{ margin: "0 0 1rem" }}>✏️ Modifier — {s.type}</h4>

                    <label style={labelStyle}>Nom affiché</label>
                    <input value={editSupport.nom} onChange={(e) => setEditSupport({ ...editSupport, nom: e.target.value })} style={inputStyle} />

                    {s.type !== "TEXTE" && s.type !== "FORUM" && (
                      <>
                        <label style={{ ...labelStyle, marginTop: "0.75rem" }}>URL</label>
                        <input value={editSupport.url} onChange={(e) => setEditSupport({ ...editSupport, url: e.target.value })} style={inputStyle} />
                      </>
                    )}

                    {(s.type === "TEXTE" || s.type === "FORUM") && (
                      <>
                        <label style={{ ...labelStyle, marginTop: "0.75rem" }}>
                          {s.type === "FORUM" ? "Objectifs du forum" : "Contenu"}
                        </label>
                        <RichEditor
                          value={editSupport.contenu}
                          onChange={(html) => setEditSupport({ ...editSupport, contenu: html })}
                        />
                      </>
                    )}

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                      <button onClick={handleUpdateSupport} style={btnSuccess}>💾 Sauvegarder</button>
                      <button onClick={() => setEditingSupport(null)} style={btnWarning}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  // ── Mode affichage ──
                  <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ background: typeColor(s.type), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem", marginRight: "0.5rem" }}>
                        {s.type}
                      </span>
                      <strong>{s.nom || s.url || "Texte"}</strong>
                      {s.url && s.type !== "TEXTE" && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                          <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "#1e40af" }}>{s.url}</a>
                        </div>
                      )}
                      {s.type === "TEXTE" && <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>📄 Contenu texte riche</div>}
                      {s.type === "FORUM" && (
                        <div style={{ marginLeft: "1rem", marginTop: "0.5rem", padding: "0.75rem", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                          <div style={{ fontSize: "0.85rem", color: "#0369a1", fontWeight: "bold", marginBottom: "0.25rem" }}>💬 Forum de discussion</div>
                          {s.contenu && <div style={{ fontSize: "0.8rem", color: "#0c4a6e", fontStyle: "italic" }} dangerouslySetInnerHTML={{ __html: s.contenu }} />}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginRight: "0.5rem" }}>
                        <button
                          onClick={() => handleMoveSupport(s.id, "up")}
                          disabled={index === 0}
                          style={{ background: index === 0 ? "#e2e8f0" : "#718096", color: "white", border: "none", borderRadius: "4px", width: "24px", height: "24px", cursor: index === 0 ? "default" : "pointer", fontSize: "0.7rem" }}>
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveSupport(s.id, "down")}
                          disabled={index === chapter.supports.length - 1}
                          style={{ background: index === chapter.supports.length - 1 ? "#e2e8f0" : "#718096", color: "white", border: "none", borderRadius: "4px", width: "24px", height: "24px", cursor: index === chapter.supports.length - 1 ? "default" : "pointer", fontSize: "0.7rem" }}>
                          ▼
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setEditingSupport(s.id);
                          setEditSupport({ nom: s.nom || "", url: s.url || "", contenu: s.contenu || "" });
                        }}
                        style={btnSmall}>
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteSupport(s.id)} style={btnDanger}>🗑</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {addingSupport ? (
              <div style={{ background: "#eff6ff", padding: "1.25rem", borderRadius: "12px", marginTop: "1rem", border: "1px solid #bfdbfe" }}>
                <h3 style={{ margin: "0 0 1rem" }}>Ajouter un support</h3>

                <label style={labelStyle}>Type de support</label>
                <select
                  value={newSupport.type}
                  onChange={(e) => { setNewSupport({ type: e.target.value, url: "", nom: "", contenu: "" }); setScormFile(null); setUploadProgress(0); }}
                  style={inputStyle}
                  disabled={uploading}
                >
                  {["PDF", "VIDEO", "IMAGE", "PPT", "SCORM", "ARTICULATE", "TEXTE", "FORUM"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Nom affiché *</label>
                <input
                  placeholder="Ex: Cours chapitre 1"
                  value={newSupport.nom}
                  onChange={(e) => setNewSupport({ ...newSupport, nom: e.target.value })}
                  style={inputStyle}
                  disabled={uploading}
                />

                {/* ── SCORM / ARTICULATE : Upload ZIP ── */}
                {isScormType(newSupport.type) && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Package ZIP *</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#dbeafe"; }}
                      onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = newSupport.type === "SCORM" ? "#7c3aed" : "#0d9488"; e.currentTarget.style.background = "#f8fafc"; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = newSupport.type === "SCORM" ? "#7c3aed" : "#0d9488";
                        e.currentTarget.style.background = "#f8fafc";
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.name.toLowerCase().endsWith(".zip")) {
                          setScormFile(file);
                        } else {
                          setError("Seuls les fichiers .zip sont acceptés");
                        }
                      }}
                      style={{
                        border: `2px dashed ${newSupport.type === "SCORM" ? "#7c3aed" : "#0d9488"}`,
                        borderRadius: "12px",
                        padding: "1.5rem",
                        textAlign: "center",
                        background: "#f8fafc",
                        cursor: uploading ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        position: "relative",
                      }}
                      onClick={() => !uploading && document.getElementById("scormFileInput")?.click()}
                    >
                      <input
                        id="scormFileInput"
                        type="file"
                        accept=".zip"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setScormFile(file);
                        }}
                        disabled={uploading}
                      />
                      {scormFile ? (
                        <div>
                          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📦</div>
                          <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "1rem" }}>{scormFile.name}</div>
                          <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                            {(scormFile.size / (1024 * 1024)).toFixed(2)} Mo
                          </div>
                          {!uploading && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setScormFile(null); }}
                              style={{ marginTop: "0.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", padding: "0.3rem 0.8rem", cursor: "pointer", fontSize: "0.8rem" }}
                            >✕ Retirer</button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{newSupport.type === "SCORM" ? "🎓" : "🎯"}</div>
                          <div style={{ fontWeight: "600", color: "#475569" }}>Glissez un package .zip ici</div>
                          <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.25rem" }}>ou cliquez pour sélectionner un fichier</div>
                          <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "0.5rem" }}>Max 50 Mo • Doit contenir un index.html</div>
                        </div>
                      )}
                    </div>

                    {/* Barre de progression */}
                    {uploading && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569", marginBottom: "0.3rem" }}>
                          <span>⏳ Upload en cours...</span>
                          <span style={{ fontWeight: "700" }}>{uploadProgress}%</span>
                        </div>
                        <div style={{ background: "#e2e8f0", borderRadius: "8px", height: "8px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            borderRadius: "8px",
                            width: `${uploadProgress}%`,
                            background: `linear-gradient(90deg, ${newSupport.type === "SCORM" ? "#7c3aed, #a855f7" : "#0d9488, #14b8a6"})`,
                            transition: "width 0.3s ease",
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Autres types : URL classique ── */}
                {!isScormType(newSupport.type) && newSupport.type !== "TEXTE" && newSupport.type !== "FORUM" && (
                  <>
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>URL / Lien *</label>
                    <input
                      placeholder="https://..."
                      value={newSupport.url}
                      onChange={(e) => setNewSupport({ ...newSupport, url: e.target.value })}
                      style={inputStyle}
                    />
                  </>
                )}

                {(newSupport.type === "TEXTE" || newSupport.type === "FORUM") && (
                  <>
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>
                      {newSupport.type === "FORUM" ? "Objectifs du forum" : "Contenu *"}
                    </label>
                    <RichEditor
                      value={newSupport.contenu}
                      onChange={(html) => setNewSupport({ ...newSupport, contenu: html })}
                    />
                  </>
                )}

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button onClick={handleAddSupport} disabled={uploading} style={{ ...btnSuccess, opacity: uploading ? 0.6 : 1, cursor: uploading ? "not-allowed" : "pointer" }}>
                    {uploading ? "⏳ Import en cours..." : isScormType(newSupport.type) ? "📦 Importer le package" : "✅ Ajouter"}
                  </button>
                  <button onClick={() => { setAddingSupport(false); setNewSupport({ type: "PDF", url: "", nom: "", contenu: "" }); setScormFile(null); setUploadProgress(0); }} disabled={uploading} style={{ ...btnWarning, opacity: uploading ? 0.6 : 1 }}>Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingSupport(true)} style={{ ...btnPrimary, marginTop: "1rem" }}>
                ➕ Ajouter un support
              </button>
            )}
          </div>
        )}

        {/* ── Tab Devoirs ── */}
        {tab === "devoirs" && (
          <div>
            {devoirs.length === 0 && (
              <p style={{ color: "#718096" }}>Aucun devoir — créez un devoir pour ce chapitre !</p>
            )}

            {devoirs.map((d) => {
              const deadline = new Date(d.dateLimit);
              const depasse  = new Date() > deadline;
              const nbRendus = d.rendus?.length || 0;
              return (
                <div key={d.id} style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontSize: "1.05rem" }}>📋 {d.titre}</strong>
                      <div style={{ fontSize: "0.85rem", color: depasse ? "#dc2626" : "#d97706", marginTop: "0.25rem" }}>
                        {depasse ? "⛔ Deadline dépassé" : "⏰ Deadline"} : {deadline.toLocaleDateString("fr-FR")} à 00h00
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{nbRendus} rendu(s)</div>
                    </div>
                    <button onClick={() => handleDeleteDevoir(d.id)} style={btnDanger}>🗑</button>
                  </div>
                  <div style={{ marginTop: "0.75rem", background: "white", padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
                    dangerouslySetInnerHTML={{ __html: d.consigne }} />
                  {nbRendus > 0 && (
                    <div style={{ marginTop: "1rem" }}>
                      <strong style={{ fontSize: "0.9rem" }}>Rendus :</strong>
                      {d.rendus.map((r) => (
                        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", background: "white", borderRadius: "6px", marginTop: "0.5rem", border: "1px solid #e2e8f0" }}>
                          <span style={{ background: r.fichierType === "PDF" ? "#dc2626" : r.fichierType === "WORD" ? "#1e40af" : "#059669", color: "white", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem" }}>
                            {r.fichierType}
                          </span>
                          <span style={{ flex: 1 }}>{r.student.prenom} {r.student.nom}</span>
                          <a href={r.fichierUrl} target="_blank" rel="noreferrer" style={{ color: "#1e40af", fontSize: "0.85rem" }}>📥 Télécharger</a>
                          {r.note !== null && r.note !== undefined
                            ? <span style={{ fontWeight: "bold", color: r.note >= 10 ? "#059669" : "#dc2626" }}>{r.note}/20</span>
                            : <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Non noté</span>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {addingDevoir ? (
              <div style={{ background: "#eff6ff", padding: "1.25rem", borderRadius: "12px", marginTop: "1rem", border: "1px solid #bfdbfe" }}>
                <h3 style={{ margin: "0 0 1rem" }}>Nouveau devoir</h3>

                <label style={labelStyle}>Titre *</label>
                <input
                  placeholder="Ex: Recherche sur les transformations géométriques"
                  value={newDevoir.titre}
                  onChange={(e) => setNewDevoir({ ...newDevoir, titre: e.target.value })}
                  style={inputStyle}
                />

                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Date limite * (fermeture à 00h00)</label>
                <input
                  type="date"
                  value={newDevoir.dateLimit}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setNewDevoir({ ...newDevoir, dateLimit: e.target.value })}
                  style={{ ...inputStyle, width: "220px" }}
                />

                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Consigne * (détaillez le travail attendu)</label>
                <RichEditor
                  value={newDevoir.consigne}
                  onChange={(html) => setNewDevoir({ ...newDevoir, consigne: html })}
                />

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button onClick={handleAddDevoir} style={btnSuccess}>✅ Créer le devoir</button>
                  <button onClick={() => { setAddingDevoir(false); setNewDevoir({ titre: "", consigne: "", dateLimit: "" }); }} style={btnWarning}>Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingDevoir(true)} style={{ ...btnPrimary, marginTop: "1rem" }}>
                ➕ Créer un devoir
              </button>
            )}
          </div>
        )}

        {/* ── Tab Quiz ── */}
                  {tab === "quiz" && (
                    <div>
                      {/* 📥 BOUTON IMPORT EN HAUT */}
                      <button 
                        onClick={() => router.push(`/dashboard/designer/courses/${id}/chapters/${chapterId}/import-quiz-formatif`)}
                        style={{ ...btnPrimary, marginBottom: "1.5rem" }}
                      >
                        📥 Importer le quiz formatif
                      </button>

                      {questions.length === 0 && (
                        <p style={{ color: "#718096" }}>Aucune question — importez ou créez un quiz formatif!</p>
                      )}

            {questions.map((q, index) => (
              <div key={q.id} style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ background: typeQColor(q.type), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", marginRight: "0.5rem" }}>
                      {q.type}
                    </span>
                    <strong>Q{index + 1} : {q.texte}</strong>
                    <span style={{ color: "#64748b", fontSize: "0.85rem", marginLeft: "0.5rem" }}>({q.points} pt{q.points > 1 ? "s" : ""})</span>
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
                {q.type === "QCM_MULTIPLE" && (
                  <ul style={{ marginTop: "0.5rem" }}>
                    {q.choix.map((c, i) => {
                      const bonnes = JSON.parse(q.reponse || "[]");
                      return <li key={i} style={{ color: bonnes.includes(c) ? "#059669" : "#4a5568", fontWeight: bonnes.includes(c) ? "bold" : "normal" }}>{bonnes.includes(c) ? "✅ " : "☐ "}{c}</li>;
                    })}
                  </ul>
                )}
                {q.type === "OUVERTE"  && <p style={{ color: "#718096", fontStyle: "italic" }}>Réponse modèle : {q.reponse}</p>}
                {q.type === "GAP"      && <p style={{ color: "#718096" }}>Réponses : {JSON.parse(q.reponse || "[]").join(", ")}</p>}
                {q.type === "MATCHING" && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {Object.entries(JSON.parse(q.reponse || "{}")).map(([g, d], i) => (
                      <div key={i} style={{ color: "#4a5568" }}>🔗 {g} → {d}</div>
                    ))}
                  </div>
                )}
                {q.type === "ORDERING" && (
                  <ol style={{ marginTop: "0.5rem" }}>
                    {JSON.parse(q.reponse || "[]").map((e, i) => <li key={i} style={{ color: "#4a5568" }}>{e}</li>)}
                  </ol>
                )}
              </div>
            ))}

            {addingQuestion ? (
              <div style={{ background: "#eff6ff", padding: "1.25rem", borderRadius: "12px", marginTop: "1rem", border: "1px solid #bfdbfe" }}>
                <h3 style={{ margin: "0 0 1rem" }}>Nouvelle question</h3>

                <label style={labelStyle}>Type de question</label>
                <select value={questionType} onChange={(e) => { setQuestionType(e.target.value); setNewQuestion(emptyQuestion); }} style={inputStyle}>
                  <option value="QCM">QCM — Une seule bonne réponse</option>
                  <option value="QCM_MULTIPLE">QCM Multiple — Plusieurs bonnes réponses</option>
                  <option value="VRAI_FAUX">Vrai / Faux</option>
                  <option value="OUVERTE">Question ouverte</option>
                  <option value="GAP">Texte à trous (Fill the gap)</option>
                  <option value="MATCHING">Relier (Matching)</option>
                  <option value="ORDERING">Remettre en ordre</option>
                </select>

                <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Points</label>
                <input type="number" min="1" max="10" value={newQuestion.points}
                  onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
                  style={{ ...inputStyle, width: "80px" }} />

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

                {questionType === "QCM_MULTIPLE" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Question *</label>
                    <input placeholder="Question..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={inputStyle} />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Choix (cochez les bonnes) *</label>
                    {newQuestion.choix.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <input type="checkbox" checked={newQuestion.reponsesMultiples.includes(c)}
                          onChange={(e) => {
                            const rep = [...newQuestion.reponsesMultiples];
                            if (e.target.checked) rep.push(c); else rep.splice(rep.indexOf(c), 1);
                            setNewQuestion({ ...newQuestion, reponsesMultiples: rep });
                          }} />
                        <input placeholder={`Choix ${i + 1}`} value={c}
                          onChange={(e) => { const choix = [...newQuestion.choix]; choix[i] = e.target.value; setNewQuestion({ ...newQuestion, choix }); }}
                          style={inputStyle} />
                      </div>
                    ))}
                  </div>
                )}

                {questionType === "VRAI_FAUX" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Affirmation *</label>
                    <input placeholder="Affirmation..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={inputStyle} />
                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
                      {["Vrai", "Faux"].map((v) => (
                        <label key={v} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                          <input type="radio" name="vf" value={v} checked={newQuestion.reponse === v} onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {questionType === "OUVERTE" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Question *</label>
                    <textarea placeholder="Question..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={{ ...inputStyle, height: "80px", resize: "vertical" }} />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Réponse modèle *</label>
                    <textarea placeholder="Réponse attendue..." value={newQuestion.reponse} onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })} style={{ ...inputStyle, height: "80px", resize: "vertical" }} />
                  </div>
                )}

                {questionType === "GAP" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Texte à trous * — utilisez [trou]</label>
                    <textarea placeholder="Ex: La capitale de [trou] est [trou]" value={newQuestion.texteTrous}
                      onChange={(e) => setNewQuestion({ ...newQuestion, texteTrous: e.target.value })}
                      style={{ ...inputStyle, height: "100px", resize: "vertical" }} />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Réponses séparées par virgules *</label>
                    <input placeholder="Ex: France, Paris" value={newQuestion.reponse} onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })} style={inputStyle} />
                  </div>
                )}

                {questionType === "MATCHING" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Question *</label>
                    <input placeholder="Question..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={inputStyle} />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Paires *</label>
                    {newQuestion.paires.map((p, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <input placeholder={`Élément ${i + 1}`} value={p.gauche}
                          onChange={(e) => { const paires = [...newQuestion.paires]; paires[i] = { ...paires[i], gauche: e.target.value }; setNewQuestion({ ...newQuestion, paires }); }} style={inputStyle} />
                        <span style={{ textAlign: "center", lineHeight: "2.5" }}>→</span>
                        <input placeholder={`Correspondance ${i + 1}`} value={p.droite}
                          onChange={(e) => { const paires = [...newQuestion.paires]; paires[i] = { ...paires[i], droite: e.target.value }; setNewQuestion({ ...newQuestion, paires }); }} style={inputStyle} />
                      </div>
                    ))}
                    <button onClick={() => setNewQuestion({ ...newQuestion, paires: [...newQuestion.paires, { gauche: "", droite: "" }] })} style={{ ...btnSmall, marginTop: "0.5rem" }}>➕ Paire</button>
                  </div>
                )}

                {questionType === "ORDERING" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={labelStyle}>Question *</label>
                    <input placeholder="Question..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={inputStyle} />
                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Éléments dans le bon ordre *</label>
                    {newQuestion.elements.map((e, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ color: "#64748b", minWidth: "20px", lineHeight: "2.5" }}>{i + 1}.</span>
                        <input placeholder={`Élément ${i + 1}`} value={e}
                          onChange={(ev) => { const elements = [...newQuestion.elements]; elements[i] = ev.target.value; setNewQuestion({ ...newQuestion, elements }); }} style={inputStyle} />
                      </div>
                    ))}
                    <button onClick={() => setNewQuestion({ ...newQuestion, elements: [...newQuestion.elements, ""] })} style={{ ...btnSmall, marginTop: "0.5rem" }}>➕ Élément</button>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                  <button onClick={handleAddQuestion} style={btnSuccess}>✅ Ajouter la question</button>
                  <button onClick={() => { setAddingQuestion(false); resetQuestion(); }} style={btnWarning}>Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingQuestion(true)} style={{ ...btnPrimary, marginTop: "1rem" }}>
                ➕ Ajouter une question
              </button>
            )}
          </div>
        )}

      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
  
}

function typeColor(type) {
  const colors = { PDF: "#dc2626", VIDEO: "#1e40af", IMAGE: "#059669", PPT: "#d97706", SCORM: "#7c3aed", ARTICULATE: "#0d9488", TEXTE: "#0ea5e9", FORUM: "#8b5cf6" };
  return colors[type] || "#475569";
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