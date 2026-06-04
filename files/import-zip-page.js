import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ImportCourseZip() {
  const router = useRouter();
  const { user } = useAuth();
  const { id: courseId } = router.query;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (batchId) {
      const interval = setInterval(() => fetchBatchStatus(batchId), 2000);
      return () => clearInterval(interval);
    }
  }, [batchId]);

  const handleUpload = async () => {
    if (!file) {
      setError("Sélectionnez un fichier ZIP");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);

      const uploadRes = await fetch("/api/import-course/upload-zip", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Erreur upload");
      }

      setSuccess("✅ ZIP uploadé et extrait!");
      setBatchId(uploadData.batchId);

      setProcessing(true);
      const processRes = await fetch("/api/import-course/process-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          batchId: uploadData.batchId,
          courseId: parseInt(courseId),
          extractDir: uploadData.extractDir,
          modules: ["chapters", "pretest", "formative", "summative"],
        }),
      });

      const processData = await processRes.json();
      if (processRes.ok) {
        setSuccess("✅ Import complété!");
        await fetchBatchStatus(uploadData.batchId);
      } else {
        setError(processData.error);
      }
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const fetchBatchStatus = async (id) => {
    try {
      const res = await fetch(`/api/import-course/batch-status?batchId=${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setBatchStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = async () => {
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/import-course/batch-retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ batchId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(`🔄 ${data.failedModules.length} module(s) en retry...`);

      setProcessing(true);
      const processRes = await fetch("/api/import-course/process-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          batchId,
          courseId: parseInt(courseId),
          extractDir: batchStatus.extractDir,
          modules: data.failedModules,
        }),
      });

      if (processRes.ok) {
        setSuccess("✅ Retry complété!");
        await fetchBatchStatus(batchId);
      } else {
        const errData = await processRes.json();
        setError(errData.error);
      }
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!router.isReady) {
    return (
      <ProtectedRoute allowedRoles={["DESIGNER"]}>
        <div style={{ textAlign: "center", padding: "2rem" }}>⏳ Chargement...</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <div style={{ maxWidth: "800px", margin: "50px auto", padding: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "1.5rem", background: "linear-gradient(135deg, #1e40af, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          📦 Import Cours Unifié
        </h1>

        {!batchStatus ? (
          <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: "1px solid #edf2f7" }}>
            <p style={{ color: "#718096", marginBottom: "1.5rem" }}>
              Uploadez un fichier ZIP contenant:
            </p>
            <ul style={{ color: "#718096", marginLeft: "1rem", marginBottom: "1.5rem" }}>
              <li>chapters.xlsx</li>
              <li>pretest.xlsx</li>
              <li>formative.xlsx</li>
              <li>summative.xlsx</li>
            </ul>

            <div style={{ background: "#f0fff4", border: "2px dashed #059669", borderRadius: "12px", padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
              <input type="file" accept=".zip" onChange={(e) => { setFile(e.target.files?.[0]); setError(""); }} style={{ display: "none" }} id="zipInput" />
              <label htmlFor="zipInput" style={{ cursor: "pointer", display: "block" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📦</div>
                <div style={{ fontWeight: "600", color: "#1e293b" }}>{file ? file.name : "Cliquez pour sélectionner"}</div>
                <div style={{ fontSize: "0.9rem", color: "#718096" }}>ou déposez le fichier ZIP</div>
              </label>
            </div>

            {error && <div style={{ background: "#fff5f5", color: "#e53e3e", padding: "1rem", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #fed7d7" }}>{error}</div>}
            {success && <div style={{ background: "#f0fff4", color: "#059669", padding: "1rem", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #c6f6d5" }}>{success}</div>}

            <button
              onClick={handleUpload}
              disabled={!file || uploading || processing}
              style={{
                width: "100%",
                padding: "1rem",
                background: file && !uploading && !processing ? "linear-gradient(135deg, #065f46, #059669)" : "#cbd5e0",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: file && !uploading && !processing ? "pointer" : "not-allowed",
              }}
            >
              {uploading ? "📤 Upload..." : processing ? "⏳ Traitement..." : "✅ Importer"}
            </button>
          </div>
        ) : (
          <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: "1px solid #edf2f7" }}>
            <h2 style={{ marginTop: 0 }}>📊 Statut d'import</h2>

            {error && <div style={{ background: "#fff5f5", color: "#e53e3e", padding: "1rem", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #fed7d7" }}>{error}</div>}
            {success && <div style={{ background: "#f0fff4", color: "#059669", padding: "1rem", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #c6f6d5" }}>{success}</div>}

            <div style={{ marginBottom: "2rem" }}>
              <h3>Modules:</h3>
              {["chapters", "pretest", "formative", "summative"].map((module) => {
                const mod = batchStatus.modules[module];
                const icon = mod.status === "SUCCESS" ? "✅" : mod.status === "FAILED" ? "❌" : mod.status === "PENDING" ? "⏳" : "⚙️";
                const color = mod.status === "SUCCESS" ? "#059669" : mod.status === "FAILED" ? "#dc2626" : "#f59e0b";

                return (
                  <div key={module} style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem", borderLeft: `4px solid ${color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: "700", color }}>{icon} {module}</span>
                        {mod.status === "SUCCESS" && <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#718096" }}>✅ {mod.created} créés</p>}
                        {mod.status === "FAILED" && <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#dc2626" }}>❌ {mod.error}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              {batchStatus.status === "PARTIAL_FAIL" && (
                <button
                  onClick={handleRetry}
                  disabled={processing}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: processing ? "#cbd5e0" : "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "600",
                    cursor: processing ? "not-allowed" : "pointer",
                  }}
                >
                  🔄 Retry modules échoués
                </button>
              )}

              <button
                onClick={() => router.push(`/dashboard/designer/courses/${courseId}`)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "linear-gradient(135deg, #1e40af, #1e3a8a)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
