import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function EditCourse() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  const [form, setForm] = useState({
    title: "", description: "", objectifs: "",
    matiere: "", niveau: "", annee: "",
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => {
    if (!id) return;
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res  = await fetch(`/api/courses/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Erreur chargement");
      setForm({
        title:       data.title       || "",
        description: data.description || "",
        objectifs:   data.objectifs   || "",
        matiere:     data.matiere     || "",
        niveau:      data.niveau      || "",
        annee:       data.annee       || "",
      });
    } catch { setError("Erreur serveur"); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setError(""); setSuccess(""); setSaving(true);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Cours mis à jour !");
        setTimeout(() => router.push(`/dashboard/designer/courses/${id}`), 1000);
      } else {
        setError(data.error || "Erreur sauvegarde");
      }
    } catch { setError("Erreur serveur"); }
    finally { setSaving(false); }
  };

  const anneesCollege = ["6eme", "5eme", "4eme", "3eme"];
  const anneesLycee   = ["1AS", "2AS", "Terminale"];

  if (loading) return <p>Chargement...</p>;  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace Designer", icon: "🎨" },
    { key: "courses",  label: "Mes cours",       icon: "📚" },
    { key: "messages", label: "Messages",        icon: "✉️" },
  ];

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎨"
        customTitle="Édition de Cours"
        tabs={DASHBOARD_TABS}
        activeTab="courses"
        onTabChange={(tab) => router.push("/dashboard/designer")}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          <button onClick={() => router.push(`/dashboard/designer/courses/${id}`)} style={btnBack}>
            <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>←</span> 
            Retour au cours
          </button>

          <div style={{ 
            background: "white", 
            padding: "2.5rem", 
            borderRadius: "20px", 
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            border: "1px solid #edf2f7"
          }}>
            <div style={{ marginBottom: "2rem", borderBottom: "1px solid #f7fafc", paddingBottom: "1.5rem" }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: "2.2rem", 
                fontWeight: "800",
                background: "linear-gradient(135deg, #059669, #10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                ✏️ Modifier le cours
              </h1>
              <p style={{ color: "#718096", marginTop: "0.5rem" }}>Ajustez les informations principales de votre programme</p>
            </div>

            {error && (
              <div style={{ 
                color: "#e53e3e", 
                background: "#fff5f5", 
                padding: "1rem", 
                borderRadius: "12px", 
                marginBottom: "1.5rem",
                border: "1px solid #fed7d7"
              }}>
                ❌ {error}
              </div>
            )}

            {success && (
              <div style={{ 
                color: "#059669", 
                background: "#f0fff4", 
                padding: "1rem", 
                borderRadius: "12px", 
                marginBottom: "1.5rem",
                border: "1px solid #c6f6d5"
              }}>
                ✅ {success}
              </div>
            )}

            <div style={{ display: "grid", gap: "1.5rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={labelStyle}>Titre du cours *</label>
                  <input name="title" value={form.title} onChange={handleChange} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Matière</label>
                  <select name="matiere" value={form.matiere} onChange={handleChange} style={inputStyle}>
                    <option value="">Choisir...</option>
                    <option value="math">Mathématiques</option>
                    <option value="physique">Physique & Chimie</option>
                    <option value="svt">SVT</option>
                    <option value="informatique">Informatique</option>
                    <option value="education_islamique">Éducation Islamique</option>
                    <option value="histoire">Histoire & Géo</option>
                    <option value="francais">Français</option>
                    <option value="anglais">Anglais</option>
                    <option value="arabe">Langue Arabe</option>
                    <option value="philosophie">Philosophie</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={labelStyle}>Niveau scolaire</label>
                  <select name="niveau" value={form.niveau} onChange={handleChange} style={inputStyle}>
                    <option value="">Choisir un niveau</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Année / Classe</label>
                  <select name="annee" value={form.annee} onChange={handleChange} style={inputStyle} disabled={!form.niveau}>
                    <option value="">Choisir une année</option>
                    {form.niveau === "college" && anneesCollege.map((a) => <option key={a} value={a}>{a}</option>)}
                    {form.niveau === "lycee"   && anneesLycee.map((a)   => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description courte</label>
                <textarea name="description" value={form.description} onChange={handleChange} style={{ ...inputStyle, height: "120px", resize: "vertical" }} />
              </div>

              <div>
                <label style={labelStyle}>Objectifs pédagogiques (séparez par | )</label>
                <textarea name="objectifs" value={form.objectifs} onChange={handleChange} style={{ ...inputStyle, height: "120px", resize: "vertical" }} />
              </div>

              <div style={{ marginTop: "1rem", paddingTop: "1.5rem", borderTop: "1px solid #f7fafc" }}>
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  style={{ 
                    ...btnPrimary, 
                    width: "100%", 
                    padding: "1rem",
                    fontSize: "1.1rem",
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)",
                    opacity: saving ? 0.7 : 1 
                  }}
                >
                  {saving ? "Sauvegarde..." : "💾 Enregistrer les modifications"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

const btnBack    = { background: "none", border: "none", color: "#f97316", cursor: "pointer", marginBottom: "1rem", fontSize: "0.95rem", fontWeight: "600" };
const btnPrimary = { background: "linear-gradient(135deg,#1e3a5f,#1e40af)", color: "white", padding: "0.75rem", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "1rem", width: "100%", fontWeight: "600", boxShadow: "0 4px 12px rgba(30,64,175,0.3)" };
const inputStyle = { width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "8px", fontSize: "1rem", boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: "0.3rem", fontWeight: "600", color: "#4a5568" };