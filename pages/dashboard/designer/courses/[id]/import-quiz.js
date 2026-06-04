import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ImportQuizPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop().toLowerCase();
      if (["xlsx", "csv"].includes(ext)) {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Utilisez XLSX ou CSV");
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Sélectionnez un fichier");
      return;
    }

    setLoading(true);
    setError("");

    try {
const base64 = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(e.target.result.split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const response = await fetch(`/api/import/import-quiz-sommatif?courseId=${id}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ fileBase64: base64 }),
});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'importation");
      }

      setSuccess(true);
      setFile(null);
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

  if (!id) return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>;

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎨"
        customTitle="Importation Quiz Sommatif"
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
              <button onClick={() => router.push(`/dashboard/designer/courses/${id}`)} style={{ background: "none", border: "none", color: "#f97316", cursor: "pointer", marginBottom: "0.5rem", fontSize: "0.95rem", fontWeight: "600" }}>
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
                📋 Importer le Test Sommatif
              </h1>
            </div>
          </div>

          <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.02)", border: "1px solid #edf2f7" }}>

        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#e0f2fe", borderRadius: "8px", border: "1px solid #0284c7" }}>
          <strong>💡 Format requis:</strong>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
            Fichier Excel/CSV avec une sheet "Quiz Sommatif" contenant: QuestionID, Ordre, Texte, Type, Choix (séparés par ,), Réponse, Points
          </p>
        </div>

        {success ? (
          <div style={{ padding: "2rem", background: "#dcfce7", borderRadius: "10px", border: "1px solid #86efac", textAlign: "center" }}>
            <h2 style={{ color: "#059669", margin: "0 0 1rem" }}>✅ Test sommatif importé!</h2>
            <p style={{ color: "#166534", marginBottom: "1.5rem" }}>
              Le test sommatif a été créé avec succès.
            </p>
            <button
              onClick={() => router.push(`/dashboard/designer/courses/${id}`)}
              style={{
                background: "#059669",
                color: "white",
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              → Retour au dashboard du cours
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#4a5568" }}>
                Fichier Test Sommatif *:
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".xlsx,.csv"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #cbd5e0",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
              {file && <p style={{ color: "green", marginTop: "0.5rem", fontSize: "0.9rem" }}>✅ {file.name}</p>}
            </div>

            {error && (
              <div style={{
                padding: "1rem",
                background: "#fecaca",
                color: "#991b1b",
                borderRadius: "8px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: loading || !file ? "#ccc" : "#059669",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading || !file ? "not-allowed" : "pointer",
                fontWeight: "600",
              }}
            >
              {loading ? "⏳ Upload..." : "📤 Importer le test sommatif"}
            </button>
          </form>
        )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
