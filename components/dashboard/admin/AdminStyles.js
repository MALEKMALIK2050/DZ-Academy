export const inputStyle = { width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" };
export const thStyle = { padding: "0.75rem", textAlign: "left", fontWeight: "bold" };
export const tdStyle = { padding: "0.75rem" };
export const btnPrimary = { background: "linear-gradient(135deg,#1e3a5f,#1e40af)", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 12px rgba(30,64,175,0.3)" };
export const btnSuccess = { background: "linear-gradient(135deg,#065f46,#059669)", color: "white", padding: "0.75rem 2rem", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
export const btnDanger = { background: "linear-gradient(135deg,#991b1b,#dc2626)", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "8px", cursor: "pointer" };
export const btnSmall = { background: "linear-gradient(135deg,#facc15,#f97316)", color: "white", padding: "0.3rem 0.9rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" };
export const btnWarning = { background: "linear-gradient(135deg,#92400e,#d97706)", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "8px", cursor: "pointer" };
export const labelStyle = { display: "block", marginBottom: "0.3rem", fontWeight: "600", color: "#4a5568" };

export function gridDateString(dernierMsg) {
  return dernierMsg ? new Date(dernierMsg.createdAt).toLocaleDateString("fr-FR") : "Aucune";
}

export function statusColor(s) {
  return s === "PUBLISHED" ? "#059669" : s === "ARCHIVED" ? "#475569" : "#d97706";
}

export function roleColor(role) {
  const colors = { ADMIN: "#d97706", TEACHER: "#059669", DESIGNER: "#7c3aed", STUDENT: "#1e40af" };
  return colors[role] || "#475569";
}

export function statutColor(s) {
  const colors = { EN_ATTENTE: "#d97706", PAYE: "#059669", GRATUIT: "#0ea5e9", REJETE: "#dc2626" };
  return colors[s] || "#475569";
}
