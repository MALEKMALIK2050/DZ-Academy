import React from "react";
import { thStyle, tdStyle } from "./AdminStyles";

export default function EvaluationsTab({ quizResults, users, UserHoverTrigger }) {
  return (
    <div>
      {quizResults.length === 0 ? (
        <p style={{ color: "#718096" }}>Aucune évaluation passée pour l'instant.</p>
      ) : (
      <div className="table-responsive">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#edf2f7" }}>
              <th style={thStyle}>Élève</th>
              <th style={thStyle}>Quiz</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Score</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {quizResults.map((r) => {
              const fullStudent = users.find((usr) => usr.id === r.student?.id) || r.student;
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={tdStyle}>
                    <UserHoverTrigger user={fullStudent} />
                  </td>
                  <td style={tdStyle}>{r.quiz.chapter?.title || r.quiz.course?.title || "—"}</td>
                  <td style={tdStyle}>
                    <span style={{ background: r.quiz.type === "SOMMATIF" ? "#7c3aed" : "#1e40af", color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem" }}>
                      {r.quiz.type}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: r.score >= 75 ? "#059669" : r.score >= 50 ? "#d97706" : "#dc2626", fontWeight: "bold", fontSize: "1.1rem" }}>
                      {r.score.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "#718096", fontSize: "0.85rem" }}>
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
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
