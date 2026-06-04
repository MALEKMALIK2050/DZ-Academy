import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import DashboardHeader from "@/components/DashboardHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chat from "@/components/Chat";

export default function DashboardAdmin() {
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: "", matieres: [], niveaux: [], classe: "", niveau: "" });
  const router = useRouter();
  const { user, logout } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [assigningCourse, setAssigningCourse] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("users");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", password: "",
    role: "TEACHER", matiere: "", niveau: "", annee: "",
  });

  useEffect(() => {
    if (!user) return;
    if (user.role?.toLowerCase() !== "admin") {
      router.replace("/login");
      return;
    }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [uRes, sRes, eRes] = await Promise.all([
        fetch("/api/users", { credentials: "include" }),
        fetch("/api/admin/stats", { credentials: "include" }),
        fetch("/api/admin/enrollments", { credentials: "include" }),
      ]);
      const uData = await uRes.json();
      const sData = await sRes.json();
      const eData = await eRes.json();

      setUsers(Array.isArray(uData) ? uData : []);
      setStats(sData);
      setEnrollments(Array.isArray(eData) ? eData : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ajout de la fonction handleDeleteCourse
  const handleDeleteCourse = async (courseId) => {
    try {
      const res = await fetch("/api/admin/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`✅ Cours supprimé avec succès !`);
        fetchAll(); // Rafraîchir les données
      } else {
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur serveur lors de la suppression");
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddUser = async () => {
    setError("");
    setSuccess("");
    if (!form.nom || !form.prenom || !form.email || !form.password)
      return setError("Tous les champs sont obligatoires");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Erreur création");
      setSuccess(`✅ ${form.prenom} ${form.nom} créé avec succès !`);
      setForm({
        nom: "", prenom: "", email: "", password: "", role: "TEACHER",
        matiere: "", niveau: "", annee: "",
      });
      setShowForm(false);
      fetchAll();
    } catch {
      setError("Erreur serveur");
    }
  };

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer / désactiver ${nom} ?`)) return;
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Chargement...</p>;

  const admins = users.filter((u) => u.role === "ADMIN");
  const teachers = users.filter((u) => u.role === "TEACHER");
  const designers = users.filter((u) => u.role === "DESIGNER");
  const students = users.filter((u) => u.role === "STUDENT");
  const courses = stats?.courses || [];
  const quizResults = stats?.quizResults || [];
  const msgStats = stats?.messages || [];
  const enAttente = enrollments.filter((e) => e.statut === "EN_ATTENTE").length;

  const TABS = [
    { key: "users", label: `👥 Utilisateurs (${users.length})` },
    { key: "courses", label: `📚 Cours (${courses.length})` },
    { key: "students", label: `👨‍🎓 Élèves (${students.length})` },
    { key: "evaluations", label: `📝 Évaluations (${quizResults.length})` },
    { key: "messages", label: `💬 Messages` },
    { key: "inscriptions", label: `📋 Inscriptions${enAttente > 0 ? ` (${enAttente} en attente)` : ""}` },
    { key: "chat", label: `💬 Chat` },
  ];

  const MATIERES = ["math", "physique", "svt", "histoire", "francais", "anglais", "arabe", "philosophie"];

  const handleEditUser = (u) => {
    setEditingUser(u.id);
    setEditForm({
      role: u.role,
      matieres: u.matieres || [],
      niveaux: u.niveaux || [],
      classe: u.classe || "",
      niveau: u.niveau || "",
    });
  };

  const handleUpdateUser = async (id) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Erreur modification");
      setSuccess("✅ Utilisateur mis à jour !");
      setEditingUser(null);
      fetchAll();
    } catch {
      setError("Erreur serveur");
    }
  };

  const handleValidateEnrollment = async (enrollmentId, statut, prixPaye, note) => {
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enrollmentId, statut, prixPaye, note }),
      });
      if (res.ok) fetchAll();
    } catch {}
  };

  const handleAssignTeacher = async (courseId) => {
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, teacherId: selectedTeacher || null }),
      });
      if (res.ok) {
        setAssigningCourse(null);
        setSelectedTeacher("");
        fetchAll();
      }
    } catch {}
  };

  const toggleMatiere = (m) => {
    const list = editForm.matieres.includes(m)
      ? editForm.matieres.filter((x) => x !== m)
      : [...editForm.matieres, m];
    setEditForm({ ...editForm, matieres: list });
  };

  const toggleNiveau = (n) => {
    const list = editForm.niveaux.includes(n)
      ? editForm.niveaux.filter((x) => x !== n)
      : [...editForm.niveaux, n];
    setEditForm({ ...editForm, niveaux: list });
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <DashboardHeader user={user} roleIcon="🏫" customTitle="Dashboard Admin" />

        {/* Stats globales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          {[
            { label: "👨‍🎓 Élèves", count: students.length, color: "linear-gradient(135deg,#1e3a5f,#1e40af)" },
            { label: "👨‍🏫 Teachers", count: teachers.length, color: "linear-gradient(135deg,#065f46,#059669)" },
            { label: "🎨 Designers", count: designers.length, color: "linear-gradient(135deg,#4c1d95,#7c3aed)" },
            { label: "📚 Cours", count: courses.length, color: "linear-gradient(135deg,#92400e,#d97706)" },
            { label: "📋 Inscrits", count: enrollments.length, color: "linear-gradient(135deg,#134e4a,#0d9488)" },
          ].map((s) => (
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

        {error && <p style={{
          color: "red",
          background: "#fff5f5",
          padding: "0.75rem",
          borderRadius: "6px",
          marginBottom: "1rem"
        }}>{error}</p>}
        {success && <p style={{
          color: "green",
          background: "#f0fff4",
          padding: "0.75rem",
          borderRadius: "6px",
          marginBottom: "1rem"
        }}>{success}</p>}

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: "1.5rem",
          flexWrap: "wrap"
        }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "0.6rem 1.1rem",
              border: "none",
              cursor: "pointer",
              background: "none",
              borderBottom: tab === t.key ? "3px solid #f97316" : "3px solid transparent",
              color: tab === t.key ? "#f97316" : "#475569",
              fontWeight: tab === t.key ? "700" : "normal",
              fontSize: "0.9rem",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab : Utilisateurs ── */}
        {tab === "users" && (
          <div>
            <button onClick={() => setShowForm(!showForm)} style={{ ...btnPrimary, marginBottom: "1rem" }}>
              {showForm ? "✖ Annuler" : "➕ Ajouter un utilisateur"}
            </button>

            {showForm && (
              <div style={{ background: "#f7fafc", padding: "1.5rem", borderRadius: "10px", marginBottom: "2rem" }}>
                <h3>Nouvel utilisateur</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <input name="nom" placeholder="Nom *" value={form.nom} onChange={handleChange} style={inputStyle} />
                  <input name="prenom" placeholder="Prénom *" value={form.prenom} onChange={handleChange} style={inputStyle} />
                  <input name="email" placeholder="Email *" value={form.email} onChange={handleChange} style={inputStyle} type="email" />
                  <input name="password" placeholder="Mot de passe *" value={form.password} onChange={handleChange} style={inputStyle} type="password" />
                </div>

                <select name="role" value={form.role} onChange={handleChange} style={{ ...inputStyle, marginTop: "1rem" }}>
                  <option value="TEACHER">👨‍🏫 Enseignant</option>
                  <option value="DESIGNER">🎨 Designer</option>
                  <option value="ADMIN">👑 Admin</option>
                  <option value="STUDENT">👨‍🎓 Élève</option>
                </select>

                {(form.role === "TEACHER" || form.role === "DESIGNER") && (
                  <>
                    <label style={{ ...labelStyle, marginTop: "1rem" }}>Matières</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {MATIERES.map((m) => (
                        <label key={m} style={{
                          cursor: "pointer",
                          background: form.matieres?.includes(m) ? "#3182ce" : "#e2e8f0",
                          color: form.matieres?.includes(m) ? "white" : "#4a5568",
                          padding: "0.3rem 0.8rem",
                          borderRadius: "20px",
                          fontSize: "0.85rem"
                        }}>
                          <input type="checkbox" style={{ display: "none" }}
                            checked={form.matieres?.includes(m) || false}
                            onChange={() => {
                              const list = form.matieres?.includes(m)
                                ? form.matieres.filter((x) => x !== m)
                                : [...(form.matieres || []), m];
                              setForm({ ...form, matieres: list });
                            }}
                          />
                          {m}
                        </label>
                      ))}
                    </div>

                    <label style={{ ...labelStyle, marginTop: "1rem" }}>Niveaux</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {["college", "lycee"].map((n) => (
                        <label key={n} style={{
                          cursor: "pointer",
                          background: form.niveaux?.includes(n) ? "#805ad5" : "#e2e8f0",
                          color: form.niveaux?.includes(n) ? "white" : "#4a5568",
                          padding: "0.3rem 0.8rem",
                          borderRadius: "20px",
                          fontSize: "0.85rem"
                        }}>
                          <input type="checkbox" style={{ display: "none" }}
                            checked={form.niveaux?.includes(n) || false}
                            onChange={() => {
                              const list = form.niveaux?.includes(n)
                                ? form.niveaux.filter((x) => x !== n)
                                : [...(form.niveaux || []), n];
                              setForm({ ...form, niveaux: list });
                            }}
                          />
                          {n === "college" ? "Collège" : "Lycée"}
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {form.role === "STUDENT" && (
                  <>
                    <select name="niveau" value={form.niveau} onChange={handleChange} style={{ ...inputStyle, marginTop: "1rem" }}>
                      <option value="">Niveau *</option>
                      <option value="college">Collège</option>
                      <option value="lycee">Lycée</option>
                    </select>

                    <select name="classe" value={form.classe || ""} onChange={handleChange} style={{ ...inputStyle, marginTop: "1rem" }}>
                      <option value="">Année *</option>
                      {form.niveau === "college" && <>
                        <option value="6eme">6ème</option>
                        <option value="5eme">5ème</option>
                        <option value="4eme">4ème</option>
                        <option value="3eme">3ème</option>
                      </>}
                      {form.niveau === "lycee" && <>
                        <option value="1AS">1AS</option>
                        <option value="2AS">2AS</option>
                        <option value="Terminale">Terminale</option>
                      </>}
                    </select>
                  </>
                )}

                <br />
                <button onClick={handleAddUser} style={{ ...btnSuccess, marginTop: "1rem" }}>✅ Créer le compte</button>
              </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#edf2f7" }}>
                  <th style={thStyle}>Nom</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Rôle</th>
                  <th style={thStyle}>Matières</th>
                  <th style={thStyle}>Niveaux</th>
                  <th style={thStyle}>Classe / Année</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                 
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={tdStyle}>{u.prenom} {u.nom}</td>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={tdStyle}>
                        <span style={{
                          background: roleColor(u.role),
                          color: "white",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "20px",
                          fontSize: "0.8rem"
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u.matieres?.length > 0
                          ? u.matieres.map((m) => (
                            <span key={m} style={{
                              background: "#dbeafe",
                              color: "#1e40af",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "10px",
                              fontSize: "0.8rem",
                              marginRight: "0.3rem"
                            }}>
                              {m}
                            </span>
                          ))
                          : "—"
                        }
                      </td>
                      <td style={tdStyle}>
                        {u.niveaux?.length > 0
                          ? u.niveaux.map((n) => (
                            <span key={n} style={{
                              background: "#ede9fe",
                              color: "#7c3aed",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "10px",
                              fontSize: "0.8rem",
                              marginRight: "0.3rem"
                            }}>
                              {n}
                            </span>
                          ))
                          : "—"
                        }
                      </td>
                      <td style={tdStyle}>
                        {u.classe || u.niveau
                          ? <span style={{
                            background: "#d1fae5",
                            color: "#059669",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "10px",
                            fontSize: "0.8rem"
                          }}>
                            {[u.niveau, u.classe].filter(Boolean).join(" / ")}
                          </span>
                          : "—"
                        }
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={() => handleEditUser(u)} style={btnSmall}>✏️ Modifier</button>
                          {u.role !== "ADMIN" && (
                            <button onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)} style={btnDanger}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {editingUser === u.id && (
                      <tr>
                        <td colSpan={7} style={{ padding: "1rem", background: "#eff6ff", borderLeft: "3px solid #bfdbfe" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
                            <div>
                              <label style={labelStyle}>Rôle</label>
                              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} style={{ ...inputStyle, width: "150px" }}>
                                <option value="TEACHER">👨‍🏫 Teacher</option>
                                <option value="DESIGNER">🎨 Designer</option>
                                <option value="ADMIN">👑 Admin</option>
                                <option value="STUDENT">👨‍🎓 Student</option>
                              </select>
                            </div>

                            {(editForm.role === "TEACHER" || editForm.role === "DESIGNER") && (
                              <div>
                                <label style={labelStyle}>Matières</label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                  {MATIERES.map((m) => (
                                    <label key={m} style={{
                                      cursor: "pointer",
                                      background: editForm.matieres.includes(m) ? "#1e40af" : "#e2e8f0",
                                      color: editForm.matieres.includes(m) ? "white" : "#4a5568",
                                      padding: "0.3rem 0.7rem",
                                      borderRadius: "20px",
                                      fontSize: "0.8rem"
                                    }}>
                                      <input type="checkbox" style={{ display: "none" }}
                                        checked={editForm.matieres.includes(m)}
                                        onChange={() => toggleMatiere(m)}
                                      />
                                      {m}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(editForm.role === "TEACHER" || editForm.role === "DESIGNER") && (
                              <div>
                                <label style={labelStyle}>Niveaux</label>
                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                  {["college", "lycee"].map((n) => (
                                    <label key={n} style={{
                                      cursor: "pointer",
                                      background: editForm.niveaux.includes(n) ? "#7c3aed" : "#e2e8f0",
                                      color: editForm.niveaux.includes(n) ? "white" : "#4a5568",
                                      padding: "0.3rem 0.7rem",
                                      borderRadius: "20px",
                                      fontSize: "0.8rem"
                                    }}>
                                      <input type="checkbox" style={{ display: "none" }}
                                        checked={editForm.niveaux.includes(n)}
                                        onChange={() => toggleNiveau(n)}
                                      />
                                      {n === "college" ? "Collège" : "Lycée"}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {editForm.role === "STUDENT" && (
                              <div style={{ display: "flex", gap: "0.75rem" }}>
                                <div>
                                  <label style={labelStyle}>Niveau</label>
                                  <select
                                    value={editForm.niveau || ""}
                                    onChange={(e) => setEditForm({ ...editForm, niveau: e.target.value, classe: "" })}
                                    style={{ ...inputStyle, width: "130px" }}
                                  >
                                    <option value="">Niveau</option>
                                    <option value="college">Collège</option>
                                    <option value="lycee">Lycée</option>
                                  </select>
                                </div>

                                <div>
                                  <label style={labelStyle}>Année</label>
                                  <select
                                    value={editForm.classe || ""}
                                    onChange={(e) => setEditForm({ ...editForm, classe: e.target.value })}
                                    style={{ ...inputStyle, width: "130px" }}
                                    disabled={!editForm.niveau}
                                  >
                                    <option value="">Année</option>
                                    {editForm.niveau === "college" && <>
                                      <option value="6eme">6ème</option>
                                      <option value="5eme">5ème</option>
                                      <option value="4eme">4ème</option>
                                      <option value="3eme">3ème</option>
                                    </>}
                                    {editForm.niveau === "lycee" && <>
                                      <option value="1AS">1AS</option>
                                      <option value="2AS">2AS</option>
                                      <option value="Terminale">Terminale</option>
                                    </>}
                                  </select>
                                </div>
                              </div>
                            )}

                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                              <button onClick={() => handleUpdateUser(u.id)} style={btnSuccess}>✅ Sauvegarder</button>
                              <button onClick={() => setEditingUser(null)} style={btnWarning}>Annuler</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab : Inscriptions ── */}
        {tab === "inscriptions" && (
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
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={thStyle}>Élève</th>
                    <th style={thStyle}>Cours</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Statut</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={tdStyle}>
                        <strong>{e.student.prenom} {e.student.nom}</strong>
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
                        <span style={{ background: "#dbeafe", color: "#1e40af", padding: "0.2rem 0.5rem", borderRadius: "10px", fontSize: "0.8rem" }}>
                          {e.typePaiement === "PARCOURS_COMPLET" ? "🎓 Parcours complet" : "💳 Cours seul"}
                        </span>
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
                                handleValidateEnrollment(e.id, prix ? "PAYE" : "GRATUIT", prix ? parseFloat(prix) : null, note);
                              }}
                              style={{ ...btnSuccess, padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}>
                              ✅ Valider
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt("Raison du rejet (ex: paiement non reçu):");
                                handleValidateEnrollment(e.id, "REJETE", null, note);
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
                                handleValidateEnrollment(e.id, "PAYE", parseFloat(prix), "Revalidé après paiement reçu");
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
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab : Cours ── */}
        {tab === "courses" && (
          <div>
            {courses.length === 0 ? (
              <p style={{ color: "#718096" }}>Aucun cours créé pour l'instant.</p>
            ) : (
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
                        {c.designer ? `${c.designer.prenom} ${c.designer.nom}` : "—"}
                        <div style={{ fontSize: "0.75rem", color: "#7c3aed" }}>{c.designer?.role}</div>
                      </td>
                      <td style={tdStyle}>
                        {c.teacher
                          ? <>{c.teacher.prenom} {c.teacher.nom}<div style={{ fontSize: "0.75rem", color: "#059669" }}>{c.teacher.role}</div></>
                          : <span style={{ color: "#dc2626" }}>Non affecté</span>
                        }
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
                              handleDeleteCourse(c.id);
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
            )}
          </div>
        )}

        {/* ── Tab : Élèves ── */}
        {tab === "students" && (
          <div>
            {students.length === 0 ? (
              <p style={{ color: "#718096" }}>Aucun élève inscrit.</p>
            ) : (
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
                          <strong>{s.prenom} {s.nom}</strong>
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
            )}
          </div>
        )}

        {/* ── Tab : Évaluations ── */}
        {tab === "evaluations" && (
          <div>
            {quizResults.length === 0 ? (
              <p style={{ color: "#718096" }}>Aucune évaluation passée pour l'instant.</p>
            ) : (
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
                  {quizResults.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={tdStyle}><strong>{r.student.prenom} {r.student.nom}</strong></td>
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
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab : Chat ── */}
        {tab === "chat" && (
          <div>
            <h2>💬 Messagerie</h2>
            <Chat />
          </div>
        )}

        {/* ── Tab : Messages ── */}
        {tab === "messages" && (
          <div>
            {msgStats.length === 0 ? (
              <p style={{ color: "#718096" }}>Aucun teacher/designer trouvé.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#edf2f7" }}>
                    <th style={thStyle}>Responsable</th>
                    <th style={thStyle}>Rôle</th>
                    <th style={thStyle}>Messages envoyés</th>
                    <th style={thStyle}>Messages reçus</th>
                    <th style={thStyle}>Non lus reçus</th>
                    <th style={thStyle}>Dernière activité</th>
                  </tr>
                </thead>
                <tbody>
                  {msgStats.map((t) => {
                    const envoyes = t.sentMessages?.length || 0;
                    const recus = t.receivedMessages?.length || 0;
                    const nonLus = t.receivedMessages?.filter((m) => !m.lu).length || 0;
                    const dernierMsg = [...(t.sentMessages || []), ...(t.receivedMessages || [])]
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={tdStyle}>
                          <strong>{t.prenom} {t.nom}</strong>
                          <div style={{ fontSize: "0.8rem", color: "#718096" }}>{t.matiere || "—"}</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ background: roleColor(t.role), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem" }}>
                            {t.role}
                          </span>
                        </td>
                        <td style={tdStyle}>{envoyes}</td>
                        <td style={tdStyle}>{recus}</td>
                        <td style={tdStyle}>
                          {nonLus > 0
                            ? <span style={{ color: "#dc2626", fontWeight: "bold" }}>{nonLus} non lu(s)</span>
                            : <span style={{ color: "#059669" }}>✅ Tout lu</span>
                          }
                        </td>
                        <td style={{ ...tdStyle, color: "#718096", fontSize: "0.85rem" }}>
                          {dernierMsg ? new Date(dernierMsg.createdAt).toLocaleDateString("fr-FR") : "Aucune"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function statusColor(s) {
  return s === "PUBLISHED" ? "#059669" : s === "ARCHIVED" ? "#475569" : "#d97706";
}

function roleColor(role) {
  const colors = { ADMIN: "#d97706", TEACHER: "#059669", DESIGNER: "#7c3aed", STUDENT: "#1e40af" };
  return colors[role] || "#475569";
}

function statutColor(s) {
  const colors = { EN_ATTENTE: "#d97706", PAYE: "#059669", GRATUIT: "#0ea5e9", REJETE: "#dc2626" };
  return colors[s] || "#475569";
}

const inputStyle = { width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" };
const thStyle = { padding: "0.75rem", textAlign: "left", fontWeight: "bold" };
const tdStyle = { padding: "0.75rem" };
const btnPrimary = { background: "linear-gradient(135deg,#1e3a5f,#1e40af)", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 12px rgba(30,64,175,0.3)" };
const btnSuccess = { background: "linear-gradient(135deg,#065f46,#059669)", color: "white", padding: "0.75rem 2rem", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const btnDanger = { background: "linear-gradient(135deg,#991b1b,#dc2626)", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "8px", cursor: "pointer" };
const btnSmall = { background: "linear-gradient(135deg,#facc15,#f97316)", color: "white", padding: "0.3rem 0.9rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" };
const btnWarning = { background: "linear-gradient(135deg,#92400e,#d97706)", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "8px", cursor: "pointer" };
const labelStyle = { display: "block", marginBottom: "0.3rem", fontWeight: "600", color: "#4a5568" };