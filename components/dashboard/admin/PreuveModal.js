import React from "react";

export default function PreuveModal({ preuveModal, onClose }) {
  if (!preuveModal) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: "16px", padding: "1.5rem",
          maxWidth: "600px", width: "100%", maxHeight: "90vh",
          overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontWeight: "800", color: "#1a202c" }}>📎 Preuve de paiement</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#94a3b8" }}
          >✕</button>
        </div>

        {preuveModal.loading && (
          <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
            ⏳ Chargement de la preuve...
          </div>
        )}

        {!preuveModal.loading && preuveModal.error && (
          <div style={{ background: "#fef2f2", color: "#dc2626", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
            ❌ {preuveModal.error}
          </div>
        )}

        {!preuveModal.loading && preuveModal.url && (() => {
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(preuveModal.url);
          return (
            <div>
              {isImage ? (
                <img
                  src={preuveModal.url}
                  alt="Preuve de paiement"
                  style={{ width: "100%", borderRadius: "10px", border: "1px solid #e2e8f0", objectFit: "contain", maxHeight: "500px" }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: "2rem", background: "#f8fafc", borderRadius: "10px" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📄</div>
                  <p style={{ color: "#475569", marginBottom: "1rem" }}>Fichier PDF — Cliquez pour l'ouvrir dans un nouvel onglet.</p>
                </div>
              )}
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <a
                  href={preuveModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.65rem 1.5rem", background: "linear-gradient(135deg,#065f46,#059669)",
                    color: "white", borderRadius: "10px", textDecoration: "none", fontWeight: "700",
                  }}
                >
                  🔗 Ouvrir en plein écran
                </a>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
