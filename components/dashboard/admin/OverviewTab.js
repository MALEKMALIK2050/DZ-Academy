import React from "react";

export default function OverviewTab({ students, teachers, designers, courses, enrollments }) {
  const stats = [
    { label: "👨‍🎓 Élèves", count: students.length, color: "linear-gradient(135deg,#1e3a5f,#1e40af)" },
    { label: "👨‍🏫 Teachers", count: teachers.length, color: "linear-gradient(135deg,#065f46,#059669)" },
    { label: "🎨 Designers", count: designers.length, color: "linear-gradient(135deg,#4c1d95,#7c3aed)" },
    { label: "📚 Cours", count: courses.length, color: "linear-gradient(135deg,#92400e,#d97706)" },
    { label: "📋 Inscrits", count: enrollments.length, color: "linear-gradient(135deg,#134e4a,#0d9488)" },
  ];

  return (
    <div className="stats-grid">
      {stats.map((s) => (
        <div key={s.label} style={{
          background: s.color,
          color: "white",
          padding: "1.25rem",
          borderRadius: "14px",
          textAlign: "center",
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)"
        }}>
          <div style={{ fontSize: "2rem", fontWeight: "800" }}>{s.count}</div>
          <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
