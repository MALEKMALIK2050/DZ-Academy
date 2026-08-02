import React from "react";
import { roleColor } from "./AdminStyles";

export default function UserHoverPreview({ hoveredUserCard }) {
  if (!hoveredUserCard) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "30px",
      right: "30px",
      width: "380px",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderRadius: "24px",
      padding: "1.5rem",
      boxShadow: "0 20px 40px rgba(15, 23, 42, 0.22)",
      border: "1px solid rgba(16, 185, 129, 0.25)",
      color: "#1e293b",
      fontFamily: "system-ui, -apple-system, sans-serif",
      zIndex: 99999,
      pointerEvents: "none",
      transition: "opacity 0.2s ease"
    }}>
      <div style={{
        height: "4px",
        width: "50px",
        background: "linear-gradient(90deg, #059669, #10b981)",
        borderRadius: "10px",
        marginBottom: "1rem"
      }} />

      <div style={{ 
        display: "flex", 
        gap: "14px", 
        alignItems: "center", 
        borderBottom: "1px solid #f1f5f9", 
        paddingBottom: "1rem", 
        marginBottom: "1rem" 
      }}>
        <img 
          src={hoveredUserCard.photo || "https://pub-c5e31b5cdafb419a86617dd0a5f6c254.r2.dev/default-avatar.png"} 
          alt={hoveredUserCard.nom} 
          style={{ 
            width: "56px", 
            height: "56px", 
            borderRadius: "50%", 
            objectFit: "cover", 
            border: "2px solid #10b981", 
            boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)"
          }}
          onError={(e) => { e.target.src = "https://pub-c5e31b5cdafb419a86617dd0a5f6c254.r2.dev/default-avatar.png"; }}
        />
        <div>
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
            {hoveredUserCard.prenom} {hoveredUserCard.nom}
          </h3>
          <span style={{
            background: roleColor(hoveredUserCard.role),
            color: "white",
            padding: "0.2rem 0.6rem",
            borderRadius: "20px",
            fontSize: "0.7rem",
            fontWeight: "700",
            display: "inline-block",
            marginTop: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)"
          }}>
            {hoveredUserCard.role}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "4px" }}>
          <span style={{ color: "#64748b", fontWeight: "600" }}>📧 Email</span>
          <span style={{ fontWeight: "700", color: "#334155" }}>{hoveredUserCard.email}</span>
        </div>
        {hoveredUserCard.telephone && (
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "4px" }}>
            <span style={{ color: "#64748b", fontWeight: "600" }}>📞 Téléphone</span>
            <span style={{ fontWeight: "700", color: "#334155" }}>{hoveredUserCard.telephone}</span>
          </div>
        )}
        {hoveredUserCard.ville && (
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "4px" }}>
            <span style={{ color: "#64748b", fontWeight: "600" }}>📍 Ville</span>
            <span style={{ fontWeight: "700", color: "#334155" }}>{hoveredUserCard.ville} ({hoveredUserCard.pays || "Algérie"})</span>
          </div>
        )}

        {hoveredUserCard.role === "STUDENT" && (
          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "12px", marginTop: "4px", border: "1px solid #edf2f7" }}>
            <div style={{ marginBottom: "4px" }}>🎓 <strong style={{ color: "#475569" }}>Scolarité :</strong> {hoveredUserCard.niveau} {hoveredUserCard.classe ? `/ ${hoveredUserCard.classe}` : ""}</div>
            {hoveredUserCard.tuteurNom && (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "4px", marginTop: "4px" }}>
                👤 <strong style={{ color: "#475569" }}>Tuteur :</strong> {hoveredUserCard.tuteurPrenom} {hoveredUserCard.tuteurNom}
                {hoveredUserCard.tuteurTelephone && <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>📞 {hoveredUserCard.tuteurTelephone}</span>}
              </div>
            )}
          </div>
        )}

        {(hoveredUserCard.role === "TEACHER" || hoveredUserCard.role === "DESIGNER") && (
          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "12px", marginTop: "4px", border: "1px solid #edf2f7" }}>
            {hoveredUserCard.specialite && <div style={{ marginBottom: "2px" }}>💼 <strong style={{ color: "#475569" }}>Spécialité :</strong> {hoveredUserCard.specialite}</div>}
            {hoveredUserCard.diplome && <div style={{ marginBottom: "2px" }}>🎓 <strong style={{ color: "#475569" }}>Diplôme :</strong> {hoveredUserCard.diplome} {hoveredUserCard.universite ? `(${hoveredUserCard.universite})` : ""}</div>}
            {hoveredUserCard.biographie && (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "4px", marginTop: "4px", fontStyle: "italic", color: "#64748b", fontSize: "0.8rem", lineHeight: "1.3" }}>
                "{hoveredUserCard.biographie}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
