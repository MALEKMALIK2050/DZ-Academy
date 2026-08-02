import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ImportQuizFormatif() {
  const router = useRouter();
  const { user } = useAuth();
  const { id: courseId, chapterId } = router.query;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (router.isReady) {
      console.log("🔍 Router prêt:", { courseId, chapterId });
      if (!chapterId) {
        setError("❌ chapterId manquant dans l'URL!");
      }
    }
  }, [router.isReady, courseId, chapterId]);

  const handleUpload = async () => {
    if (!file) {
      setError("Sélectionnez un fichier Excel");
      return;
    }

    if (!chapterId) {
      setError("❌ chapterId manquant - Vérifiez l'URL");
      console.error("URL actuelle:", router.asPath);
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      console.log("📤 Upload du fichier...", { chapterId: parseInt(chapterId) });

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/import/upload-excel", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || "Erreur upload");
      }

      const uploadData = await uploadRes.json();
      const filepath = uploadData.file?.filepath;

      if (!filepath) {
        throw new Error("filepath non retourné par l'upload");
      }
      console.log("✅ Fichier uploadé:", filepath);

      const importRes = await fetch("/api/import/import-quiz-formatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          filepath, 
          chapterId: parseInt(chapterId) 
        }),
      });

      const importData = await importRes.json();
      console.log("📦 Réponse API:", importData);

      if (!importRes.ok) {
        throw new Error(importData.error || "Erreur import");
      }

      setMessage(`✅ ${importData.created} questions importées!`);
      setTimeout(() => {
        router.push(`/dashboard/designer/courses/${courseId}/chapters/${chapterId}`);
      }, 2000);
    } catch (err) {
      console.error("❌ Erreur:", err);
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace Designer", icon: "🎨" },
    { key: "courses",  label: "Mes cours",       icon: "📚" },
    { key: "messages", label: "Messages",        icon: "✉️" },
  ];

  if (!router.isReady) {
    return (
      <ProtectedRoute allowedRoles={["DESIGNER"]}>
        <div style={{ maxWidth: "600px", margin: "50px auto", padding: "2rem", background: "white", borderRadius: "20px", textAlign: "center" }}>
          <p>⏳ Chargement...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎨"
        customTitle="Importer Quiz Formatif"
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
              <button onClick={() => router.push(`/dashboard/designer/courses/${courseId}/chapters/${chapterId}`)} style={{ background: "none", border: "none", color: "#f97316", cursor: "pointer", marginBottom: "0.5rem", fontSize: "0.95rem", fontWeight: "600" }}>
                ← Retour au chapitre
              </button>
              <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "800", color: "#1e293b" }}>
                📝 Importer Quiz Formatif
              </h1>
              <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.95rem" }}>
                Importez les questions du quiz formatif pour ce chapitre
              </p>
            </div>
          </div>

          <div style={{ background: "white", padding: "2.5rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #edf2f7" }}>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "1.25rem", borderRadius: "12px", marginBottom: "2rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#334155", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                💡 Informations requises
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", lineHeight: "1.5" }}>
                Le fichier Excel doit contenir un onglet <strong>"Quiz Formatif"</strong> avec les colonnes suivantes :<br/>
                <code>QuestionID | Ordre | Texte | Type | Choix | Réponse | Points</code>
              </p>
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
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setError("");
                }}
                style={{ display: "none" }}
                id="fileInput"
              />
              <label htmlFor="fileInput" style={{ cursor: "pointer", display: "block" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📁</div>
                <div style={{ fontWeight: "600", color: "#334155", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                  {file ? file.name : "Cliquez pour sélectionner un fichier Excel"}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                  Format accepté : .xlsx, .xls
                </div>
              </label>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#ef4444", padding: "1rem 1.25rem", borderRadius: "12px", marginBottom: "2rem", border: "1px solid #fee2e2", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.95rem", fontWeight: "500" }}>
                ❌ {error}
              </div>
            )}
            
            {message && (
              <div style={{ background: "#f0fdf4", color: "#22c55e", padding: "1rem 1.25rem", borderRadius: "12px", marginBottom: "2rem", border: "1px solid #dcfce7", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.95rem", fontWeight: "500" }}>
                ✅ {message}
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
                onClick={() => router.push(`/dashboard/designer/courses/${courseId}/chapters/${chapterId}`)}
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