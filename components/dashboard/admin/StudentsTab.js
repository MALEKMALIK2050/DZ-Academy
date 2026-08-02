import React from "react";
import { thStyle, tdStyle } from "./AdminStyles";

export default function StudentsTab({ students, enrollments, UserHoverTrigger }) {
  return (
    <div>
      {students.length === 0 ? (
        <p style={{ color: "#718096" }}>Aucun élève inscrit.</p>
      ) : (
      <div className="table-responsive">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#edf2f7" }}>
              <th style={thStyle}>Élève</th>
              <th style={thStyle}>Niveau / Classe</th>
              <th style={thStyle}>Cours suivis</th>
              <th style={thStyle}>Progression moy.</th>
              <th style={thStyle}>Cours complétés</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const sesEnrollments = enrollments.filter((e) => e.studentId === s.id);
              const progMoy = sesEnrollments.length
                ? Math.round(sesEnrollments.reduce((acc, e) => acc + e.progression, 0) / sesEnrollments.length)
                : 0;
              const completes = sesEnrollments.filter((e) => e.completed).length;
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={tdStyle}>
                    <UserHoverTrigger user={s} />
                    <div style={{ fontSize: "0.8rem", color: "#718096" }}>{s.email}</div>
                  </td>
                  <td style={tdStyle}>{s.niveau || "—"} / {s.classe || "—"}</td>
                  <td style={tdStyle}>{sesEnrollments.length}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ background: "#e2e8f0", borderRadius: "10px", height: "8px", width: "80px", overflow: "hidden" }}>
                        <div style={{ background: progMoy > 75 ? "#059669" : progMoy > 40 ? "#d97706" : "#dc2626", width: `${progMoy}%`, height: "100%" }} />
                      </div>
                      <span style={{ fontSize: "0.85rem" }}>{progMoy}%</span>
                    </div>
                  </td>
                  <td style={tdStyle}>{completes} / {sesEnrollments.length}</td>
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
