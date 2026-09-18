import React, { useState } from "react";
import { thStyle, tdStyle, btnSuccess, btnSmall, btnWarning, statusColor } from "./AdminStyles";

export default function CoursesTab({
  courses, teachers, users,
  assigningCourse, selectedTeachers,
  onAssignStart, onAssignCancel, onAssignTeacher,
  onSelectedTeachersChange, onDeleteCourse,
  onUpdatePrice, onUpdateAllPrices,
  UserHoverTrigger,
}) {
  const [priceInputs, setPriceInputs] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savedStatus, setSavedStatus] = useState({});
  const [bulkPrice, setBulkPrice] = useState("500");
  const [bulkLoading, setBulkLoading] = useState(false);

  return (
    <div>
      {courses.length === 0 ? (
        <p style={{ color: "#718096" }}>Aucun cours créé pour l'instant.</p>
      ) : (
        <div className="table-responsive">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#edf2f7" }}>
                <th style={thStyle}>Cours</th>
                <th style={thStyle}>Matière</th>
                <th style={thStyle}>Niveau / Année</th>
                <th style={thStyle}>Conçu par</th>
                <th style={thStyle}>Responsable</th>
                <th style={thStyle}>Statut</th>
                <th style={{ ...thStyle, minWidth: "170px" }}>Tarification</th>
                <th style={thStyle}>Élèves</th>
                <th style={thStyle}>Chapitres</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
            {courses.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={tdStyle}><strong>{c.title}</strong></td>
                <td style={tdStyle}>{c.matiere || "—"}</td>
                <td style={tdStyle}>{c.niveau || "—"} {c.annee || ""}</td>
                <td style={tdStyle}>
                  {c.designer ? (
                    <UserHoverTrigger user={users.find((usr) => usr.id === c.designer?.id) || c.designer} />
                  ) : "—"}
                  <div style={{ fontSize: "0.75rem", color: "#7c3aed" }}>{c.designer?.role}</div>
                </td>
                <td style={tdStyle}>
                  {assigningCourse === c.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "150px" }}>
                      <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #cbd5e0", borderRadius: "6px", padding: "0.5rem", background: "white" }}>
                        {teachers.map((t) => (
                          <label key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.2rem 0", fontSize: "0.85rem", cursor: "pointer" }}>
                            <input 
                              type="checkbox" 
                              checked={selectedTeachers.includes(t.id)} 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  onSelectedTeachersChange([...selectedTeachers, t.id]);
                                } else {
                                  onSelectedTeachersChange(selectedTeachers.filter(id => id !== t.id));
                                }
                              }}
                            />
                            {t.prenom} {t.nom}
                          </label>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button onClick={() => onAssignTeacher(c.id)} style={{ ...btnSuccess, padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>✅</button>
                        <button onClick={onAssignCancel} style={{ ...btnWarning, padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>✖</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {c.teachers && c.teachers.length > 0 ? (
                        c.teachers.map(t => (
                          <div key={t.id} style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                            • <UserHoverTrigger user={users.find((usr) => usr.id === t.id) || t} />
                            <div style={{ fontSize: "0.7rem", color: "#059669", marginLeft: "1rem" }}>{t.role}</div>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: "#dc2626", fontSize: "0.85rem" }}>Non affecté</span>
                      )}
                      <button
                        onClick={() => onAssignStart(c.id, c.teachers?.map(t => t.id) || [])}
                        style={{ ...btnSmall, fontSize: "0.75rem", padding: "0.2rem 0.6rem", marginTop: "0.3rem" }}
                      >
                        ✏️ Assigner
                      </button>
                    </div>
                  )}
                </td>
                <td style={tdStyle}>
                  <span style={{ background: statusColor(c.status), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem" }}>
                    {c.status}
                  </span>
                </td>
                <td style={tdStyle}>
                  {(() => {
                    const rawVal = priceInputs[c.id] !== undefined ? priceInputs[c.id] : (c.prix ?? 500);
                    const isFree = Number(rawVal) === 0;

                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                        <select
                          value={isFree ? "GRATUIT" : "PAYANT"}
                          onChange={async (e) => {
                            const selectedType = e.target.value;
                            if (selectedType === "GRATUIT") {
                              setPriceInputs((prev) => ({ ...prev, [c.id]: 0 }));
                              if (onUpdatePrice) {
                                setSavingId(c.id);
                                await onUpdatePrice(c.id, 0);
                                setSavingId(null);
                                setSavedStatus((prev) => ({ ...prev, [c.id]: true }));
                                setTimeout(() => setSavedStatus((prev) => ({ ...prev, [c.id]: false })), 2000);
                              }
                            } else {
                              const defaultPaidPrice = (c.prix && c.prix > 0) ? c.prix : 500;
                              setPriceInputs((prev) => ({ ...prev, [c.id]: defaultPaidPrice }));
                            }
                          }}
                          style={{
                            padding: "0.3rem 0.45rem",
                            borderRadius: "6px",
                            border: isFree ? "1.5px solid #86efac" : "1.5px solid #cbd5e1",
                            fontWeight: "700",
                            fontSize: "0.8rem",
                            background: isFree ? "#ecfdf5" : "white",
                            color: isFree ? "#059669" : "#1e293b",
                            cursor: "pointer"
                          }}
                        >
                          <option value="PAYANT">💰 Payant</option>
                          <option value="GRATUIT">🎁 Gratuit</option>
                        </select>

                        {!isFree ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <input
                              type="number"
                              min="100"
                              step="50"
                              value={rawVal}
                              onChange={(e) => setPriceInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                              style={{
                                width: "70px",
                                padding: "0.3rem 0.4rem",
                                borderRadius: "6px",
                                border: "1.5px solid #cbd5e1",
                                fontWeight: "700",
                                fontSize: "0.85rem",
                                color: "#1e293b",
                                textAlign: "right"
                              }}
                            />
                            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>DA</span>
                            <button
                              onClick={async () => {
                                const valToSave = priceInputs[c.id] !== undefined ? priceInputs[c.id] : (c.prix ?? 500);
                                if (onUpdatePrice) {
                                  setSavingId(c.id);
                                  await onUpdatePrice(c.id, parseInt(valToSave) || 500);
                                  setSavingId(null);
                                  setSavedStatus((prev) => ({ ...prev, [c.id]: true }));
                                  setTimeout(() => setSavedStatus((prev) => ({ ...prev, [c.id]: false })), 2000);
                                }
                              }}
                              disabled={savingId === c.id}
                              title="Sauvegarder le prix de ce cours"
                              style={{
                                background: savedStatus[c.id] ? "#059669" : "linear-gradient(135deg, #1e3a5f, #1e40af)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "0.32rem 0.55rem",
                                cursor: savingId === c.id ? "not-allowed" : "pointer",
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                transition: "all 0.2s"
                              }}
                            >
                              {savingId === c.id ? "⏳" : savedStatus[c.id] ? "✅" : "💾"}
                            </button>
                          </div>
                        ) : (
                          savedStatus[c.id] && (
                            <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: "800" }}>✅ Enregistré</span>
                          )
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td style={tdStyle}>{c.enrollments?.length || 0}</td>
                <td style={tdStyle}>{c.chapters?.length || 0}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => {
                      if (confirm(`⚠️ Supprimer "${c.title}" définitivement?`)) {
                        onDeleteCourse(c.id);
                      }
                    }}
                    style={{
                      background: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem 0.8rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>

          {/* ── BANNIÈRE TARIFICATION GLOBALE ── */}
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem 1.5rem",
            background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
            border: "1.5px solid #e2e8f0",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "0.95rem" }}>
                ⚡ Fixer le prix de tous les cours en masse
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Applique le même montant à l'ensemble des cours du catalogue en un seul clic
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="number"
                min="100"
                step="50"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                style={{
                  width: "90px",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  textAlign: "right"
                }}
              />
              <span style={{ fontWeight: "700", color: "#64748b", fontSize: "0.85rem" }}>DA</span>
              <button
                onClick={async () => {
                  if (!bulkPrice || isNaN(parseInt(bulkPrice))) {
                    alert("Veuillez saisir un prix valide");
                    return;
                  }
                  if (confirm(`Appliquer le prix de ${bulkPrice} DA à TOUS les cours ?`)) {
                    setBulkLoading(true);
                    if (onUpdateAllPrices) {
                      await onUpdateAllPrices(parseInt(bulkPrice));
                    }
                    setBulkLoading(false);
                    alert("Prix appliqué à tous les cours avec succès !");
                  }
                }}
                disabled={bulkLoading}
                style={{
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.45rem 1rem",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: bulkLoading ? "not-allowed" : "pointer"
                }}
              >
                {bulkLoading ? "⏳ Application..." : "✅ Appliquer à tous les cours"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
