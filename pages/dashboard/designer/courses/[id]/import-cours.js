import { useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ImportChaptersSupportsDevoirsPage() {
  const router = useRouter();
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

  if (!router.isReady) return <div style={{ padding: "2rem" }}>⏳</div>;

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <div
        style={{
          maxWidth: "800px",
          margin: "50px auto",
          padding: "2rem",
          background: "linear-gradient(135deg, #f0fdf4 0%, #fef3c7 100%)",
          borderRadius: "20px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "2rem", fontWeight: "800" }}>
            📚 Import Chapitres + Supports + Devoirs
          </h1>
          <p style={{ margin: 0, color: "#666", fontSize: "0.95rem" }}>
            Importez tous vos contenus en une seule fois
          </p>
        </div>

        {/* Instructions */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: "0 0 1rem", color: "#059669" }}>📋 Format requis:</h3>
          <ol style={{ color: "#4b5563", lineHeight: "1.8", margin: 0 }}>
            <li>
              <strong>Sheet "Chapitres":</strong> Titre, Ordre, Objectifs
            </li>
            <li>
              <strong>Sheet "Supports":</strong> Chapitre (Titre), Type (TEXTE/VIDEO/PDF/SCORM/FORUM/IMAGE), Nom, URL/Contenu, Ordre
            </li>
            <li>
              <strong>Sheet "Quiz Formatifs":</strong> Chapitre (Titre), Question, Option1, Option2, Option3, Option4, Réponse, Points
            </li>
            <li>
              <strong>Sheet "Devoirs":</strong> Chapitre (Titre), Titre, Description, DateLimit
            </li>
          </ol>
        </div>

        {/* Template Download */}
        <div
          style={{
            background: "#e0f2fe",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid #0284c7",
          }}
        >
          <p style={{ margin: "0 0 0.5rem", color: "#0c4a6e", fontWeight: "600" }}>
            💡 Besoin d'un template?
          </p>
          <a
            href="/chapitres-supports-devoirs-TEMPLATE.xlsx"
            download
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              background: "#0284c7",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "0.9rem",
            }}
          >
            ⬇️ Télécharger le template
          </a>
        </div>

        {/* Upload */}
        <div
          style={{
            background: "white",
            border: "2px dashed #059669",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0])}
            style={{ display: "none" }}
            id="fileInput"
          />
          <label htmlFor="fileInput" style={{ cursor: "pointer", display: "block" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📤</div>
            <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
              {file ? file.name : "Sélectionnez un fichier Excel"}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#666" }}>
              ou glissez-déposez votre fichier
            </div>
          </label>
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              border: "1px solid #fecaca",
            }}
          >
            ❌ {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              border: "1px solid #86efac",
            }}
          >
            ✅ {success}
            {stats && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                • {stats.chapitres} chapitres
                <br />• {stats.supports} supports
                <br />• {stats.devoirs} devoirs
              </div>
            )}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            width: "100%",
            padding: "0.75rem 1.5rem",
            background: file && !loading ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: file && !loading ? "pointer" : "not-allowed",
            fontWeight: "600",
            fontSize: "1rem",
            boxShadow: file && !loading ? "0 4px 12px rgba(5, 150, 105, 0.3)" : "none",
          }}
        >
          {loading ? "⏳ Import en cours..." : "✅ Importer"}
        </button>
      </div>
    </ProtectedRoute>
  );
}
