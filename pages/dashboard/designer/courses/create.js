import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function CreateCourse() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "", description: "", objectifs: "",
    matiere: "", niveau: "", annee: "",
  });

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.matiere || !form.niveau || !form.annee) {
      return setError("Titre, matière, niveau et année sont obligatoires");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) return setError(data.detail ? `${data.error}: ${data.detail}` : (data.error || "Erreur création cours"));

      router.push(`/dashboard/designer/courses/${data.id}`);

    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const anneesCollege = ["6eme", "5eme", "4eme", "3eme"];
  const anneesLycee   = ["1AS", "2AS", "Terminale"];  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace Designer", icon: "🎨" },
    { key: "courses",  label: "Mes cours",       icon: "🎨" },
    { key: "messages", label: "Messages",        icon: "✉️" },
  ];

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎨"
        customTitle="Création de Cours"
        tabs={DASHBOARD_TABS}
        activeTab="overview"
        onTabChange={(tab) => router.push("/dashboard/designer")}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          <button onClick={() => router.push("/dashboard/designer")} style={btnBack}>
            <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>←</span> 
            Retour au dashboard
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
                ➕ Nouveau Cours
              </h1>
              <p style={{ color: "#718096", marginTop: "0.5rem" }}>Définissez les bases de votre nouveau programme pédagogique</p>
            </div>

            {error && (
              <div style={{ 
                color: "#e53e3e", 
                background: "#fff5f5", 
                padding: "1rem", 
                borderRadius: "12px", 
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                border: "1px solid #fed7d7"
              }}>
                <span>❌</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={labelStyle}>Titre du cours *</label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="Ex: Maîtrise des Fonctions Trigonométriques" style={inputStyle} required />
                </div>

                <div>
                  <label style={labelStyle}>Matière *</label>
                  <select name="matiere" value={form.matiere} onChange={handleChange} style={inputStyle} required>
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
                  <label style={labelStyle}>Niveau scolaire *</label>
                  <select name="niveau" value={form.niveau} onChange={handleChange} style={inputStyle} required>
                    <option value="">Choisir un niveau</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Année / Classe *</label>
                  <select name="annee" value={form.annee} onChange={handleChange} style={inputStyle} required disabled={!form.niveau}>
                    <option value="">Choisir une année</option>
                    {form.niveau === "college" && anneesCollege.map((a) => <option key={a} value={a}>{a}</option>)}
                    {form.niveau === "lycee"   && anneesLycee.map((a)   => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description courte</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Présentez brièvement le but de ce cours..." style={{ ...inputStyle, height: "100px", resize: "vertical" }} />
              </div>

              <div>
                <label style={labelStyle}>Objectifs pédagogiques</label>
                <textarea name="objectifs" value={form.objectifs} onChange={handleChange} placeholder="Qu'est-ce que l'élève saura faire à la fin ? (Séparez par | )" style={{ ...inputStyle, height: "100px", resize: "vertical" }} />
              </div>

              <div style={{ marginTop: "1rem", paddingTop: "1.5rem", borderTop: "1px solid #f7fafc" }}>
                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{ 
                    ...btnPrimary, 
                    width: "100%", 
                    padding: "1rem",
                    fontSize: "1.1rem",
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)",
                    opacity: loading ? 0.7 : 1 
                  }}
                >
                  {loading ? "Création en cours..." : "🚀 Créer et commencer à construire"}
                </button>
              </div>

            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

const labelStyle  = { display: "block", marginBottom: "0.3rem", fontWeight: "600", color: "#4a5568" };
const inputStyle  = { width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "8px", fontSize: "1rem", boxSizing: "border-box" };
const btnPrimary  = { background: "linear-gradient(135deg,#1e3a5f,#1e40af)", color: "white", padding: "0.75rem", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "1rem", fontWeight: "600", boxShadow: "0 4px 12px rgba(30,64,175,0.3)" };
const btnBack     = { background: "none", border: "none", color: "#f97316", cursor: "pointer", marginBottom: "1rem", fontSize: "0.95rem", fontWeight: "600" };