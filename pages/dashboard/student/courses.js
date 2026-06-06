"use client";
import { useEffect, useState } from "react";

export default function StudentCoursesPage() {
  const [data, setData]       = useState({ catalogue: [], enrollments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [sending, setSending] = useState({}); // courseId en cours

  const fetchCourses = () => {
    fetch("/api/student/courses", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les cours");
        return res.json();
      })
      .then((data) => { setData(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDemande = async (courseId) => {
    setSending((p) => ({ ...p, [courseId]: true }));
    try {
      const res = await fetch("/api/student/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, typePaiement: "COURS_SEUL" }),
      });
      if (res.ok) {
        // Notifier l'admin
        await fetch("/api/notifications/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ courseId, type: "DEMANDE_INSCRIPTION" }),
        });
        fetchCourses(); // Recharger pour mettre à jour le statut
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending((p) => ({ ...p, [courseId]: false }));
    }
  };

  // Trouver le statut d'inscription pour un cours
  const getEnrollment = (courseId) =>
    data.catalogue
      .find((c) => c.id === courseId)
      ?.enrollments?.[0] || null;

  const btnStatut = (enrollment, courseId) => {
    if (!enrollment) {
      return (
        <button
          onClick={() => handleDemande(courseId)}
          disabled={sending[courseId]}
          style={{
            marginTop: "0.75rem",
            width: "100%",
            padding: "0.6rem",
            background: sending[courseId] ? "#a0aec0" : "linear-gradient(135deg, #3182ce, #2b6cb0)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: sending[courseId] ? "not-allowed" : "pointer",
            fontWeight: "700",
            fontSize: "0.9rem",
          }}
        >
          {sending[courseId] ? "⏳ Envoi..." : "📩 Demander l'accès"}
        </button>
      );
    }

    const colors = {
      EN_ATTENTE: { bg: "#fffff0", color: "#b7791f", label: "⏳ En attente de validation" },
      VALIDE:     { bg: "#f0fff4", color: "#276749", label: "✅ Accès validé" },
      REJETE:     { bg: "#fff5f5", color: "#c53030", label: "❌ Demande rejetée" },
    };
    const cfg = colors[enrollment.statut] || colors.EN_ATTENTE;

    return (
      <div style={{
        marginTop: "0.75rem",
        padding: "0.5rem 0.75rem",
        background: cfg.bg,
        color: cfg.color,
        borderRadius: "8px",
        fontWeight: "700",
        fontSize: "0.85rem",
        textAlign: "center",
      }}>
        {cfg.label}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#2d3748", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        📚 Catalogue & Inscriptions
      </h1>

      {loading && <p style={{ color: "#718096" }}>Chargement en cours...</p>}
      {error   && <p style={{ color: "#e53e3e", background: "#fff5f5", padding: "1rem", borderRadius: "8px" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

          {/* Mes inscriptions */}
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#4a5568", marginBottom: "1rem" }}>
              📋 Mes Inscriptions ({data.enrollments?.length || 0})
            </h2>
            {data.enrollments?.length === 0 ? (
              <p style={{ color: "#a0aec0", fontStyle: "italic" }}>Vous n'êtes inscrit à aucun cours.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {data.enrollments.map((e) => (
                  <div key={e.id} style={{ padding: "1.25rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>{e.course?.title || "Cours"}</h3>
                    <span style={{
                      display: "inline-block",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "12px",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      background: e.statut === "VALIDE" ? "#f0fff4" : e.statut === "REJETE" ? "#fff5f5" : "#fffff0",
                      color: e.statut === "VALIDE" ? "#276749" : e.statut === "REJETE" ? "#c53030" : "#b7791f",
                      marginBottom: "0.75rem",
                    }}>
                      {e.statut === "VALIDE" ? "✅ Validé" : e.statut === "REJETE" ? "❌ Rejeté" : "⏳ En attente"}
                    </span>
                    {e.statut === "VALIDE" && (
                      <>
                        <div style={{ width: "100%", background: "#e2e8f0", height: "6px", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${e.progression || 0}%`, background: "#4299e1", height: "100%" }} />
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#718096", marginTop: "0.25rem", display: "block" }}>
                          Progression : {e.progression || 0}%
                        </span>
                        <a href={`/dashboard/student/courses/${e.courseId}`} style={{
                          display: "block",
                          marginTop: "0.75rem",
                          padding: "0.5rem",
                          background: "#ebf8ff",
                          color: "#2b6cb0",
                          borderRadius: "8px",
                          textAlign: "center",
                          textDecoration: "none",
                          fontWeight: "700",
                          fontSize: "0.9rem",
                        }}>
                          ▶️ Accéder au cours
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catalogue */}
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#4a5568", marginBottom: "1rem" }}>
              🗂️ Catalogue des Cours ({data.catalogue?.length || 0})
            </h2>
            {data.catalogue?.length === 0 ? (
              <p style={{ color: "#a0aec0", fontStyle: "italic" }}>Aucun cours n'est actuellement publié.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {data.catalogue.map((c) => {
                  const enrollment = c.enrollments?.[0] || null;
                  return (
                    <div key={c.id} style={{ padding: "1.25rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <h3 style={{ fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>{c.title}</h3>
                      <p style={{ fontSize: "0.85rem", color: "#718096", marginBottom: "0.5rem" }}>
                        {c.niveau} • {c.matiere} • {c.annee}
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "#a0aec0" }}>
                        {c.chapters?.length || 0} chapitre{c.chapters?.length !== 1 ? "s" : ""}
                      </p>
                      {btnStatut(enrollment, c.id)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}