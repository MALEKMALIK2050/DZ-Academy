import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminCourses() {
  const [courses, setCourses]   = useState([]);
  const [teachers, setTeachers] = useState([]); // TEACHER + DESIGNER
  const [loading, setLoading]   = useState(true);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [cRes, uRes] = await Promise.all([
        fetch("/api/courses", { credentials: "include" }),
        fetch("/api/users",   { credentials: "include" }),
      ]);

      const cData = await cRes.json();
      const uData = await uRes.json();

      setCourses(Array.isArray(cData) ? cData : []);

      // Responsables = TEACHER + DESIGNER
      setTeachers(
        Array.isArray(uData)
          ? uData.filter((u) => u.role === "TEACHER" || u.role === "DESIGNER")
          : []
      );
    } catch {
      setError("Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (courseId, teacherId) => {
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, teacherId: teacherId || null }),
      });

      if (res.ok) {
        setSuccess("✅ Responsable affecté !");
        fetchAll();
      } else {
        setError("Erreur affectation");
      }
    } catch {
      setError("Erreur serveur");
    }
  };

  if (loading) return <p>Chargement...</p>;

  // Grouper par niveau
  const college = courses.filter((c) => c.niveau === "college");
  const lycee   = courses.filter((c) => c.niveau === "lycee");
  const autres  = courses.filter((c) => !c.niveau);

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>

        <h1>📚 Gestion des cours</h1>

        {success && <p style={{ color: "green", background: "#f0fff4", padding: "0.75rem", borderRadius: "6px" }}>{success}</p>}
        {error   && <p style={{ color: "red",   background: "#fff5f5", padding: "0.75rem", borderRadius: "6px" }}>{error}</p>}

        {courses.length === 0 ? (
          <p style={{ color: "#718096" }}>Aucun cours créé pour l'instant — le designer doit d'abord créer des cours.</p>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "flex", gap: "1rem", margin: "1rem 0 2rem" }}>
              <StatBox label="Total cours"  value={courses.length}  color="#3182ce" />
              <StatBox label="📗 Collège"   value={college.length}  color="#38a169" />
              <StatBox label="📘 Lycée"     value={lycee.length}    color="#805ad5" />
              <StatBox label="Sans niveau"  value={autres.length}   color="#718096" />
            </div>

            {/* Collège */}
            {college.length > 0 && (
              <Section
                title="📗 Collège"
                courses={college}
                teachers={teachers}
                onAssign={handleAssign}
              />
            )}

            {/* Lycée */}
            {lycee.length > 0 && (
              <Section
                title="📘 Lycée"
                courses={lycee}
                teachers={teachers}
                onAssign={handleAssign}
              />
            )}

            {/* Sans niveau */}
            {autres.length > 0 && (
              <Section
                title="❓ Sans niveau"
                courses={autres}
                teachers={teachers}
                onAssign={handleAssign}
              />
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

function Section({ title, courses, teachers, onAssign }) {
  // Grouper par année
  const byAnnee = courses.reduce((acc, c) => {
    const key = c.annee || "Non définie";
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>{title}</h2>

      {Object.entries(byAnnee).map(([annee, list]) => (
        <div key={annee} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ color: "#4a5568", marginBottom: "0.5rem" }}>🎓 {annee}</h3>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#edf2f7" }}>
                <th style={thStyle}>Cours</th>
                <th style={thStyle}>Matière</th>
                <th style={thStyle}>Designer</th>
                <th style={thStyle}>Élèves</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Responsable suivi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={tdStyle}><strong>{c.title}</strong></td>
                  <td style={tdStyle}>{c.matiere || "—"}</td>
                  <td style={tdStyle}>{c.designer?.prenom} {c.designer?.nom}</td>
                  <td style={tdStyle}>{c.enrollments?.length || 0}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: c.status === "PUBLISHED" ? "#38a169" : c.status === "ARCHIVED" ? "#718096" : "#dd6b20",
                      color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem"
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <select
                      defaultValue={c.teacherId || ""}
                      onChange={(e) => onAssign(c.id, e.target.value)}
                      style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e0", width: "100%" }}
                    >
                      <option value="">— Non affecté —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.prenom} {t.nom} ({t.role})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: color, color: "white", padding: "1rem 1.5rem", borderRadius: "10px", textAlign: "center", minWidth: "120px" }}>
      <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: "0.85rem" }}>{label}</div>
    </div>
  );
}

const thStyle = { padding: "0.75rem", textAlign: "left", fontWeight: "bold" };
const tdStyle = { padding: "0.75rem" };