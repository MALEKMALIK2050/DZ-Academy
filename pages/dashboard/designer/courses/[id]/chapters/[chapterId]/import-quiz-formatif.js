import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

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
      <div style={{ maxWidth: "600px", margin: "50px auto", padding: "2rem", background: "white", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", border: "1px solid #edf2f7" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "1.5rem", background: "linear-gradient(135deg, #1e40af, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          📝 Importer Quiz Formatif
        </h1>

        <div style={{ background: "#f0f9ff", border: "1px solid #bfdbfe", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#1e40af" }}>
          <strong>🔍 Info:</strong><br/>
          Chapitre ID: <code>{chapterId || "❌ MANQUANT"}</code><br/>
          Cours ID: <code>{courseId || "?"}</code>
        </div>

        <p style={{ color: "#718096", marginBottom: "1.5rem", lineHeight: "1.6" }}>
          Importez un fichier Excel contenant les questions du quiz formatif de ce chapitre.
        </p>

        <div style={{ background: "#f0fff4", border: "2px dashed #059669", borderRadius: "12px", padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
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
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📁</div>
            <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "0.25rem" }}>
              {file ? file.name : "Cliquez pour sélectionner un fichier"}
            </div>
            <div style={{ fontSize: "0.9rem", color: "#718096" }}>ou déposez un fichier Excel</div>
          </label>
        </div>

        {error && (
          <div style={{ background: "#fff5f5", color: "#e53e3e", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #fed7d7" }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: "#f0fff4", color: "#059669", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #c6f6d5" }}>
            {message}
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              flex: 1,
              padding: "0.75rem 1.5rem",
              background: file && !loading ? "linear-gradient(135deg, #065f46, #059669)" : "#cbd5e0",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: file && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "⏳ Import en cours..." : "✅ Importer"}
          </button>
          <button
            onClick={() => router.push(`/dashboard/designer/courses/${courseId}/chapters/${chapterId}`)}
            style={{
              flex: 1,
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #92400e, #d97706)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
        </div>

        <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", marginTop: "2rem", border: "1px solid #e2e8f0" }}>
          <h3 style={{ marginTop: 0, color: "#1e293b" }}>📋 Format attendu:</h3>
          <p style={{ color: "#718096", fontSize: "0.9rem", margin: "0.5rem 0" }}>
            <strong>Sheet "Quiz Formatif"</strong> avec colonnes:
          </p>
          <code style={{ display: "block", background: "#fff", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "0.85rem", color: "#1e293b", border: "1px solid #e2e8f0" }}>
            QuestionID | Ordre | Texte | Type | Choix | Réponse | Points
          </code>
          <p style={{ color: "#718096", fontSize: "0.85rem", margin: "0.5rem 0 0" }}>
            Types: QCM, VRAI_FAUX, QCM_MULTIPLE, OUVERTE, GAP, MATCHING, ORDERING
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}