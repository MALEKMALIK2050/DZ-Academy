import React from "react";
import { thStyle, tdStyle, btnSuccess, btnDanger, statutColor } from "./AdminStyles";

export default function InscriptionsTab({
  enrollments, users,
  onViewPreuve, onValidateEnrollment,
  UserHoverTrigger,
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["EN_ATTENTE", "PAYE", "GRATUIT", "REJETE"].map((s) => (
          <span key={s} style={{
            background: statutColor(s),
            color: "white",
            padding: "0.3rem 0.8rem",
            borderRadius: "20px",
            fontSize: "0.85rem"
          }}>
            {s} ({enrollments.filter((e) => e.statut === s).length})
          </span>
        ))}
      </div>

      {enrollments.length === 0 ? (
        <p style={{ color: "#718096" }}>Aucune demande d'inscription.</p>
      ) : (
        <div className="table-responsive">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={thStyle}>Élève</th>
                <th style={thStyle}>Cours</th>
                <th style={thStyle}>Type & Preuve</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
            {enrollments.map((e) => {
              const fullStudent = users.find((usr) => usr.id === e.student?.id) || e.student;
              return (
                <tr key={e.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={tdStyle}>
                    <UserHoverTrigger user={fullStudent} />
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{e.student.email}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{e.student.niveau} / {e.student.classe}</div>
                  </td>
                  <td style={tdStyle}>
                    <strong>{e.course.title}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {[e.course.matiere, e.course.niveau, e.course.annee].filter(Boolean).join(" • ")}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: "#dbeafe", color: "#1e40af", padding: "0.2rem 0.5rem", borderRadius: "10px", fontSize: "0.8rem", display: "inline-block", marginBottom: "0.5rem" }}>
                      {e.typePaiement === "PARCOURS_COMPLET" ? "🎓 Parcours complet" : "💳 Cours seul"}
                    </span>
                    {e.preuvePaiementUrl ? (
                      <button
                        onClick={() => onViewPreuve(e.id)}
                        style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "#059669", textDecoration: "none", background: "#ecfdf5", padding: "0.3rem 0.5rem", borderRadius: "6px", border: "1px solid #10b981", cursor: "pointer", fontWeight: "600" }}
                      >
                        📎 Voir la preuve
                      </button>
                    ) : (
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                        Aucune preuve
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: statutColor(e.statut), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem" }}>
                      {e.statut}
                    </span>
                    {e.prixPaye && <div style={{ fontSize: "0.8rem", color: "#059669", marginTop: "0.2rem" }}>💰 {e.prixPaye} DA</div>}
                    {e.note && <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.2rem", fontStyle: "italic" }}>{e.note}</div>}
                  </td>
                  <td style={{ ...tdStyle, color: "#718096", fontSize: "0.85rem" }}>
                    {new Date(e.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td style={tdStyle}>
                    {e.statut === "EN_ATTENTE" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <button
                          onClick={() => {
                            const prix = prompt("Prix payé (DA) — laisser vide si gratuit:");
                            const note = prompt("Note (optionnel):");
                            onValidateEnrollment(e.id, prix ? "PAYE" : "GRATUIT", prix ? parseFloat(prix) : null, note);
                          }}
                          style={{ ...btnSuccess, padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}>
                          ✅ Valider
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt("Raison du rejet (ex: paiement non reçu):");
                            onValidateEnrollment(e.id, "REJETE", null, note);
                          }}
                          style={{ ...btnDanger, padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}>
                          ❌ Rejeter
                        </button>
                      </div>
                    )}

                    {e.statut === "REJETE" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <div style={{ fontSize: "0.8rem", color: "#dc2626" }}>
                          Rejeté le {e.valideAt ? new Date(e.valideAt).toLocaleDateString("fr-FR") : "—"}
                        </div>
                        <button
                          onClick={() => {
                            const prix = prompt("Montant reçu (DA):");
                            if (!prix) return;
                            onValidateEnrollment(e.id, "PAYE", parseFloat(prix), "Revalidé après paiement reçu");
                          }}
                          style={{ background: "linear-gradient(135deg,#4c1d95,#7c3aed)", color: "white", padding: "0.3rem 0.8rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}>
                          💳 Paiement reçu → Valider
                        </button>
                      </div>
                    )}

                    {(e.statut === "PAYE" || e.statut === "GRATUIT") && (
                      <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                        <div>✅ Validé le {e.valideAt ? new Date(e.valideAt).toLocaleDateString("fr-FR") : "—"}</div>
                        {e.prixPaye && <div style={{ color: "#059669", fontWeight: "bold" }}>{e.prixPaye} DA reçus</div>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
