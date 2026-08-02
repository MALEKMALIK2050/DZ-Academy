import React from "react";
import { thStyle, tdStyle, btnSuccess, btnSmall, btnWarning, statusColor } from "./AdminStyles";

export default function CoursesTab({
  courses, teachers, users,
  assigningCourse, selectedTeachers,
  onAssignStart, onAssignCancel, onAssignTeacher,
  onSelectedTeachersChange, onDeleteCourse,
  UserHoverTrigger,
}) {
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
        </div>
      )}
    </div>
  );
}
