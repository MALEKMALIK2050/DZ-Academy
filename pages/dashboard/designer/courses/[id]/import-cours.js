import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ImportChaptersSupportsDevoirsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { id: courseId } = router.query;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Sélectionnez un fichier");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      
        const res = await fetch(`/api/import/cours?courseId=${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fileBase64: base64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess("✅ Import terminé!");
        setStats(data.stats);
        setFile(null);
        setTimeout(() => {
          router.push(`/dashboard/designer/courses/${courseId}`);
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace Designer", icon: "🎨" },
    { key: "courses",  label: "Mes cours",       icon: "📚" },
    { key: "messages", label: "Messages",        icon: "✉️" },
  ];

  if (!router.isReady) return <div style={{ padding: "2rem" }}>⏳</div>;

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎨"
        customTitle="Importation Cours Complet"
        tabs={DASHBOARD_TABS}
        activeTab="courses"
        onTabChange={(t) => router.push("/dashboard/designer")}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
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
              <button onClick={() => router.push(`/dashboard/designer/courses/${courseId}`)} style={{ background: "none", border: "none", color: "#f97316", cursor: "pointer", marginBottom: "0.5rem", fontSize: "0.95rem", fontWeight: "600" }}>
                ← Retour au cours
              </button>
              <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "800", color: "#1e293b" }}>
                📚 Import Chapitres + Supports + Devoirs
              </h1>
              <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.95rem" }}>
                Importez tous vos contenus en une seule fois
              </p>
            </div>
          </div>
          
          <div style={{ background: "white", padding: "2.5rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #edf2f7" }}>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "1.25rem", borderRadius: "12px", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#334155", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  💡 Format requis
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  Le fichier Excel doit contenir les onglets suivants :
                  <strong> Chapitres, Supports, Quiz Formatifs, Devoirs</strong>
                </p>
              </div>
              <a
                href="/chapitres-supports-devoirs-TEMPLATE.xlsx"
                download
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  background: "#e2e8f0",
                  color: "#334155",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  border: "1px solid #cbd5e1"
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#cbd5e1"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
              >
                ⬇️ Télécharger le modèle
              </a>
            </div>

            <div style={{
              background: "#f8fafc",
              border: "2px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "3rem 2rem",
              textAlign: "center",
              marginBottom: "2rem",
              transition: "all 0.2s ease"
            }}>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0])}
                style={{ display: 'none' }}
                id="fileInput"
              />
              <label htmlFor="fileInput" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                <div style={{ fontWeight: '600', color: "#334155", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                  {file ? file.name : "Cliquez pour sélectionner un fichier Excel"}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                  Format accepté : .xlsx
                </div>
              </label>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#ef4444", padding: "1rem 1.25rem", borderRadius: "12px", marginBottom: "2rem", border: "1px solid #fee2e2", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.95rem", fontWeight: "500" }}>
                ❌ {error}
              </div>
            )}
            
            {success && (
              <div style={{ background: "#f0fdf4", color: "#22c55e", padding: "1rem 1.25rem", borderRadius: "12px", marginBottom: "2rem", border: "1px solid #dcfce7", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.95rem", fontWeight: "500" }}>
                ✅ {success}
                {stats && (
                  <div style={{ marginLeft: "1rem", fontSize: "0.85rem", color: "#166534" }}>
                    ({stats.chapitres} chapitres, {stats.supports} supports, {stats.devoirs} devoirs)
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                style={{
                  flex: 1,
                  padding: "1rem",
                  background: file && !loading ? "#7c3aed" : "#cbd5e1",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: file && !loading ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  boxShadow: file && !loading ? "0 4px 12px rgba(124, 58, 237, 0.2)" : "none",
                }}
              >
                {loading ? "⏳ Traitement en cours..." : "📤 Démarrer l'importation"}
              </button>
              <button
                onClick={() => router.push(`/dashboard/designer/courses/${courseId}`)}
                style={{
                  padding: "1rem 1.5rem",
                  background: "white",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748b"; }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
