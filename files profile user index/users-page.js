import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileDropdown from "@/components/ProfileDropdown";

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", {
          credentials: "include", // ✅ fix — était dans headers au lieu d'ici
        });

        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Erreur lors du chargement");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const teachers  = users.filter((u) => u.role === "TEACHER");
  const designers = users.filter((u) => u.role === "DESIGNER");
  const students  = users.filter((u) => u.role === "STUDENT");

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}> {/* ✅ fix casse */}
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "800", color: "#1e293b" }}>
              👋 Bienvenue {user?.prenom}!
            </h1>
            <p style={{ color: "#718096", margin: "0.5rem 0 0" }}>Gestion des utilisateurs</p>
          </div>
          <ProfileDropdown userRole="ADMIN" />
        </div>

        {/* Stats rapides */}
        <div style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
          <span>👨‍🎓 Élèves : <strong>{students.length}</strong></span>
          <span>👨‍🏫 Teachers : <strong>{teachers.length}</strong></span>
          <span>🎨 Designers : <strong>{designers.length}</strong></span>
        </div>

        {users.length === 0 ? (
          <p>Aucun utilisateur</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#edf2f7" }}>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Rôle</th>
                <th style={thStyle}>Matière</th>
                <th style={thStyle}>Niveau</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={tdStyle}>{u.prenom} {u.nom}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>
                    <span style={{ background: roleColor(u.role), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem" }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={tdStyle}>{u.matiere || "—"}</td>
                  <td style={tdStyle}>{u.niveau || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ProtectedRoute>
  );
}

const thStyle = { padding: "0.75rem", textAlign: "left", fontWeight: "bold" };
const tdStyle = { padding: "0.75rem" };

function roleColor(role) {
  const colors = { ADMIN: "#dd6b20", TEACHER: "#38a169", DESIGNER: "#805ad5", STUDENT: "#3182ce" };
  return colors[role] || "#718096";
}