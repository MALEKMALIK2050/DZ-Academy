// ======================================================
// FICHIER : components/PolicyModal.js
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
          borderRadius: "1rem",
          maxWidth: "42rem",
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          animation: "slideUp 0.2s ease-out",
        }}
      >
        {/* En-tête */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #e5e7eb",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "#1f2937",
              margin: 0,
            }}
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              color: "#6b7280",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.375rem",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#f3f4f6")}
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
          >
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div
          style={{
            padding: "1.5rem",
            overflowY: "auto",
            flex: 1,
            fontSize: "0.95rem",
            lineHeight: "1.6",
            color: "#374151",
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Pied */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            borderRadius: "0 0 1rem 1rem",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "0.625rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#1d4ed8")}
            onMouseLeave={(e) => (e.target.style.background = "#2563eb")}
          >
            J'ai compris
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
            transform: translateY(20px) scale(0.95);
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