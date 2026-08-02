// ======================================================
// FICHIER : components/PolicyModal.js
// MODIFICATION : Bouton "J'ai compris" stylisé vert/orange
// ======================================================

import { useEffect, useRef } from "react";

export default function PolicyModal({ isOpen, onClose, title, content }) {
  const modalRef = useRef(null);

  // Fermer avec la touche ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Fermer en cliquant en dehors
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // 🎨 Couleurs du LMS
  const colors = {
    green: {
      light: "#ecfdf5",
      DEFAULT: "#059669",
      hover: "#047857",
      gradient: "linear-gradient(135deg, #059669, #10b981)",
    },
    orange: {
      light: "#fffbeb",
      DEFAULT: "#f59e0b",
      hover: "#d97706",
      text: "#92400e",
    },
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: "white",
          borderRadius: "1.5rem",
          maxWidth: "42rem",
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          animation: "slideUp 0.2s ease-out",
          overflow: "hidden",
        }}
      >
        {/* En-tête avec dégradé vert */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 1.75rem",
            background: colors.green.gradient,
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: "1.4rem",
              fontWeight: "800",
              color: "white",
              margin: 0,
              letterSpacing: "-0.025em",
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              fontSize: "1.5rem",
              color: "white",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.5rem",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2.5rem",
              height: "2.5rem",
            }}
            onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,0.2)")}
          >
            ✕
          </button>
        </div>

        {/* Contenu avec style amélioré */}
        <div
          style={{
            padding: "1.75rem 2rem",
            overflowY: "auto",
            flex: 1,
            fontSize: "0.95rem",
            lineHeight: "1.7",
            color: colors.text.primary,
            backgroundColor: "#fafafa",
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Pied avec bouton "J'ai compris" stylisé */}
        <div
          style={{
            padding: "1rem 2rem",
            borderTop: `2px solid ${colors.orange.light}`,
            backgroundColor: "white",
            borderRadius: "0 0 1.5rem 1.5rem",
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "0.75rem 2.5rem",
              background: colors.green.gradient,
              color: "white",
              border: "none",
              borderRadius: "3rem",
              fontSize: "1rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
              letterSpacing: "0.025em",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(5, 150, 105, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 14px rgba(5, 150, 105, 0.35)";
            }}
          >
            ✅ فهمتُ
          </button>
        </div>
      </div>

      {/* Styles d'animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}