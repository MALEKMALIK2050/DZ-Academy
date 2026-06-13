// components/SupportsList.jsx
import { useState, useEffect } from "react";
import YouTubePlayer from "./YouTubePlayer";

export default function SupportsList({ chapterId, isTeacher = false }) {
  const [supports, setSupports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSupports, setExpandedSupports] = useState({});

  useEffect(() => {
    if (!chapterId) return;
    fetchSupports();
  }, [chapterId]);

  const fetchSupports = async () => {
    try {
      const res = await fetch(`/api/supports?chapterId=${chapterId}`, {
        credentials: "include",
      });
      const data = await res.json();
      setSupports(data);
      setError("");
    } catch (err) {
      setError("Erreur chargement supports");
    } finally {
      setLoading(false);
    }
  };

  const toggleSupport = (supportId) => {
    setExpandedSupports((prev) => ({
      ...prev,
      [supportId]: !prev[supportId],
    }));
  };

  const handleProgressUpdate = (data) => {
    console.log("Progression mise à jour:", data);
    // Rafraîchir les supports si besoin
    fetchSupports();
  };

  if (loading) return <div style={{ padding: "1rem", color: "#718096" }}>Chargement des supports...</div>;
  if (error) return <div style={{ padding: "1rem", color: "#dc2626" }}>{error}</div>;
  if (supports.length === 0) return <div style={{ padding: "1rem", color: "#718096" }}>Aucun support disponible</div>;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3 style={{ marginBottom: "1rem", color: "#2d3748" }}>📚 Supports du chapitre</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {supports.map((support) => {
          const progress = support.videoProgress?.[0];
          const isExpanded = expandedSupports[support.id];
          const isVideo = support.type === "VIDEO";
          const isPDF = support.type === "PDF";
          const isTexte = support.type === "TEXTE";
          const isScorm = support.type === "SCORM";
          const isArticulate = support.type === "ARTICULATE";
          const isScormLike = isScorm || isArticulate;
          const isImage = support.type === "IMAGE";
          const isPPT = support.type === "PPT";
          const isForum = support.type === "FORUM";

          return (
            <div
              key={support.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                overflow: "hidden",
                background: "#f8fafc",
                transition: "all 0.3s",
              }}
            >
              {/* Header — titre + icone */}
              <div
                onClick={() => (isVideo || isScormLike) && toggleSupport(support.id)}
                style={{
                  padding: "1rem",
                  background: getTypeBg(support.type),
                  color: "white",
                  cursor: (isVideo || isScormLike) ? "pointer" : "default",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                  <span style={{ fontSize: "1.3rem" }}>{getTypeIcon(support.type)}</span>
                  <div>
                    <strong style={{ fontSize: "1rem" }}>{support.nom || support.url || "Support"}</strong>
                    {progress && (
                      <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "0.25rem" }}>
                        Progression : <strong>{progress.progression}%</strong>
                        {progress.completed && " ✅ Complété"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow pour vidéos et SCORM */}
                {(isVideo || isScormLike) && (
                  <span style={{ fontSize: "1.5rem", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                    ▼
                  </span>
                )}

                {/* Icon actions rapides */}
                {!isVideo && !isScormLike && (
                  <a
                    href={support.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      color: "white",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    Ouvrir →
                  </a>
                )}

                {/* Bouton lancer pour SCORM/Articulate */}
                {isScormLike && (
                  <a
                    href={support.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: "rgba(255,255,255,0.25)",
                      padding: "0.5rem 1.2rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: "white",
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    ▶ Plein écran
                  </a>
                )}
              </div>

              {/* Contenu détaillé */}
              {isExpanded && isVideo && (
                <div style={{ padding: "1.5rem", borderTop: "1px solid #e2e8f0" }}>
                  <YouTubePlayer
                    support={{
                      id: support.id,
                      videoId: support.videoId,
                      nom: support.nom,
                      url: support.url,
                    }}
                    userId={null} // À récupérer depuis contexte utilisateur
                    onProgress={handleProgressUpdate}
                  />
                </div>
              )}

              {/* Contenu texte */}
              {isTexte && support.contenu && (
                <div
                  style={{
                    padding: "1.5rem",
                    borderTop: "1px solid #e2e8f0",
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                  }}
                  dangerouslySetInnerHTML={{ __html: support.contenu }}
                />
              )}

              {/* Contenu SCORM/Articulate en iframe */}
              {isExpanded && isScormLike && (
                <div style={{ borderTop: "1px solid #e2e8f0" }}>
                  <iframe
                    src={support.url}
                    title={support.nom || "Contenu SCORM"}
                    style={{
                      width: "100%",
                      height: "600px",
                      border: "none",
                      display: "block",
                    }}
                    allowFullScreen
                  />
                </div>
              )}

              {/* Placeholder pour autres types */}
              {!isVideo && !isTexte && !isScormLike && (
                <div style={{ padding: "1.5rem", borderTop: "1px solid #e2e8f0", color: "#718096" }}>
                  {isPDF && "📄 Fichier PDF"}
                  {isImage && "🖼️ Image"}
                  {isPPT && "🎨 Présentation PowerPoint"}
                  {isForum && "💬 Forum de discussion"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTypeIcon(type) {
  const icons = {
    VIDEO: "🎬",
    PDF: "📄",
    IMAGE: "🖼️",
    PPT: "🎨",
    SCORM: "🎓",
    ARTICULATE: "🎯",
    TEXTE: "📝",
    FORUM: "💬",
  };
  return icons[type] || "📎";
}

function getTypeBg(type) {
  const colors = {
    VIDEO: "linear-gradient(135deg, #1e40af, #3b82f6)",
    PDF: "#dc2626",
    IMAGE: "#059669",
    PPT: "#d97706",
    SCORM: "#7c3aed",
    ARTICULATE: "#0d9488",
    TEXTE: "#0ea5e9",
    FORUM: "#8b5cf6",
  };
  return colors[type] || "#475569";
}
