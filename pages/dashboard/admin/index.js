import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chat from "@/components/Chat";
import DashboardLayout from "../../../components/layout/DashboardLayout";

// ── Composants extraits ──
import OverviewTab from "@/components/dashboard/admin/OverviewTab";
import UsersTab from "@/components/dashboard/admin/UsersTab";
import InscriptionsTab from "@/components/dashboard/admin/InscriptionsTab";
import CoursesTab from "@/components/dashboard/admin/CoursesTab";
import StudentsTab from "@/components/dashboard/admin/StudentsTab";
import EvaluationsTab from "@/components/dashboard/admin/EvaluationsTab";
import MessagesTab from "@/components/dashboard/admin/MessagesTab";
import UserHoverPreview from "@/components/dashboard/admin/UserHoverPreview";
import PreuveModal from "@/components/dashboard/admin/PreuveModal";

export default function DashboardAdmin() {
  const router = useRouter();
  const { user } = useAuth();

  // ── États principaux ──
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── États formulaire utilisateur ──
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", password: "",
    role: "TEACHER", matiere: "", niveau: "", annee: "",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: "", matieres: [], niveaux: [], classe: "", niveau: "" });

  // ── États cours / assignation ──
  const [assigningCourse, setAssigningCourse] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);

  // ── États modals ──
  const [hoveredUserCard, setHoveredUserCard] = useState(null);
  const [preuveModal, setPreuveModal] = useState(null);
  const [validationModal, setValidationModal] = useState(null);

  // ── Initialisation ──
  useEffect(() => {
    if (!user) return;
    if (user.role?.toLowerCase() !== "admin") {
      router.replace("/login");
      return;
    }
    fetchAll();
  }, [user]);

  // ── Marquer comme lu quand on ouvre l'onglet chat ──
  useEffect(() => {
    if (tab === "chat") {
      const markAsRead = async () => {
        const unreadMessages = messages.filter((m) => m.receiverId === user?.id && !m.lu);
        if (unreadMessages.length > 0) {
          for (let msg of unreadMessages) {
            await fetch("/api/messages", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ messageId: msg.id }),
            });
          }
          fetchAll();
        }
      };
      markAsRead();
    }
  }, [tab]);

  // ── Fetch global ──
  const fetchAll = async () => {
    try {
      const [uRes, sRes, eRes, mRes] = await Promise.all([
        fetch("/api/users",             { credentials: "include" }),
        fetch("/api/admin/stats",       { credentials: "include" }),
        fetch("/api/admin/enrollments", { credentials: "include" }),
        fetch("/api/messages",          { credentials: "include" }),
      ]);
      const uData = await uRes.json();
      const sData = await sRes.json();
      const eData = await eRes.json();
      const mData = await mRes.json();

      setUsers(Array.isArray(uData) ? uData : []);
      setStats(sData);
      setEnrollments(Array.isArray(eData) ? eData : []);
      setMessages(Array.isArray(mData) ? mData : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers utilisateurs ──
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddUser = async () => {
    setError(""); setSuccess("");
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
      setForm({ nom: "", prenom: "", email: "", password: "", role: "TEACHER", matiere: "", niveau: "", annee: "" });
      setShowForm(false);
      fetchAll();
    } catch { setError("Erreur serveur"); }
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
    } catch (err) { console.error(err); }
  };

  const handleEditUser = (u) => {
    setEditingUser(u.id);
    setEditForm({ role: u.role, matieres: u.matieres || [], niveaux: u.niveaux || [], classe: u.classe || "", niveau: u.niveau || "" });
  };

  const handleUpdateUser = async (id) => {
    setError(""); setSuccess("");
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
    } catch { setError("Erreur serveur"); }
  };

  const toggleMatiere = (m) => {
    const list = editForm.matieres.includes(m) ? editForm.matieres.filter((x) => x !== m) : [...editForm.matieres, m];
    setEditForm({ ...editForm, matieres: list });
  };

  const toggleNiveau = (n) => {
    const list = editForm.niveaux.includes(n) ? editForm.niveaux.filter((x) => x !== n) : [...editForm.niveaux, n];
    setEditForm({ ...editForm, niveaux: list });
  };

  // ── Handlers inscriptions ──
  const handleValidateEnrollment = async (enrollmentId, statut, prixPaye, note) => {
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enrollmentId, statut, prixPaye, note }),
      });
      if (res.ok) { setValidationModal(null); fetchAll(); }
    } catch {}
  };

  const handleViewPreuve = async (enrollmentId) => {
    setPreuveModal({ enrollmentId, url: null, loading: true });
    try {
      const res = await fetch(`/api/admin/preuve-url?enrollmentId=${enrollmentId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPreuveModal({ enrollmentId, url: data.url, loading: false });
      } else {
        setPreuveModal({ enrollmentId, url: null, loading: false, error: "Impossible de charger la preuve" });
      }
    } catch {
      setPreuveModal({ enrollmentId, url: null, loading: false, error: "Erreur réseau" });
    }
  };

  // ── Handlers cours ──
  const handleAssignTeacher = async (courseId) => {
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, teacherIds: selectedTeachers }),
      });
      if (res.ok) { setAssigningCourse(null); setSelectedTeachers([]); fetchAll(); }
    } catch {}
  };

  const handleDeleteCourse = async (courseId) => {
    setSuccess(""); setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { setSuccess("✅ Cours supprimé !"); fetchAll(); }
      else { setError("Erreur suppression"); }
    } catch { setError("Erreur serveur"); }
  };

  const UserHoverTrigger = ({ user: u, label }) => {
    if (!u) return null;
    return (
      <span
        onMouseEnter={() => setHoveredUserCard(u)}
        onMouseLeave={() => setHoveredUserCard(null)}
        style={{ color: "#059669", textDecoration: "underline", textDecorationStyle: "dotted", fontWeight: "700", cursor: "pointer", transition: "color 0.2s ease" }}
      >
        {label || `${u.prenom} ${u.nom}`}
      </span>
    );
  };

  if (loading) return <p>Chargement...</p>;

  const teachers = users.filter((u) => u.role === "TEACHER" || u.role === "DESIGNER");
  const designers = users.filter((u) => u.role === "DESIGNER");
  const students = users.filter((u) => u.role === "STUDENT");
  const courses = stats?.courses || [];
  const quizResults = stats?.quizResults || [];
  const msgStats = stats?.messages || [];
  const enAttente = enrollments.filter((e) => e.statut === "EN_ATTENTE").length;
  const totalUnreadChat = messages.filter((m) => m.receiverId === user?.id && !m.lu).length;

  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace Admin", icon: "👑" },
    { key: "users", label: "Utilisateurs", icon: "👥", badge: users.length },
    { key: "courses", label: "Cours", icon: "📚", badge: courses.length },
    { key: "students", label: "Élèves", icon: "👨‍🎓", badge: students.length },
    { key: "evaluations", label: "Évaluations", icon: "📝", badge: quizResults.length },
    { key: "messages", label: "Messages", icon: "✉️" },
    { key: "inscriptions", label: "Inscriptions", icon: "📋", badge: enAttente },
    { key: "chat", label: "Chat", icon: "💬", badge: totalUnreadChat },
  ];

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <DashboardLayout
        user={user}
        roleIcon="👑"
        customTitle="Espace Admin"
        tabs={DASHBOARD_TABS}
        activeTab={tab}
        onTabChange={setTab}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <div>
            <h1 style={{ 
              margin: 0, fontSize: "2.5rem", fontWeight: "800",
              background: "linear-gradient(135deg, #059669, #10b981)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
              👑 Dashboard Admin
            </h1>
            <p style={{ color: "#718096" }}>Gérez les utilisateurs, les cours et la plateforme</p>
          </div>
        </div>

        {tab === "overview" && (
          <OverviewTab students={students} teachers={teachers} designers={designers} courses={courses} enrollments={enrollments} />
        )}

        {error && <p style={{ color: "red", background: "#fff5f5", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>{error}</p>}
        {success && <p style={{ color: "green", background: "#f0fff4", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>{success}</p>}

        {tab === "users" && (
          <UsersTab
            users={users} form={form} showForm={showForm}
            editingUser={editingUser} editForm={editForm}
            onToggleForm={() => setShowForm(!showForm)}
            onFormChange={handleChange}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onUpdateUser={handleUpdateUser}
            onCancelEdit={() => setEditingUser(null)}
            onDeleteUser={handleDelete}
            onEditFormChange={setEditForm}
            onToggleMatiere={toggleMatiere}
            onToggleNiveau={toggleNiveau}
            UserHoverTrigger={UserHoverTrigger}
          />
        )}

        {tab === "inscriptions" && (
          <InscriptionsTab
            enrollments={enrollments} users={users}
            onViewPreuve={handleViewPreuve}
            onValidateEnrollment={handleValidateEnrollment}
            UserHoverTrigger={UserHoverTrigger}
          />
        )}

        {tab === "courses" && (
          <CoursesTab
            courses={courses} teachers={teachers} users={users}
            assigningCourse={assigningCourse} selectedTeachers={selectedTeachers}
            onAssignStart={(id, teacherIds) => { setAssigningCourse(id); setSelectedTeachers(teacherIds); }}
            onAssignCancel={() => setAssigningCourse(null)}
            onAssignTeacher={handleAssignTeacher}
            onSelectedTeachersChange={setSelectedTeachers}
            onDeleteCourse={handleDeleteCourse}
            UserHoverTrigger={UserHoverTrigger}
          />
        )}

        {tab === "students" && (
          <StudentsTab students={students} enrollments={enrollments} UserHoverTrigger={UserHoverTrigger} />
        )}

        {tab === "evaluations" && (
          <EvaluationsTab quizResults={quizResults} users={users} UserHoverTrigger={UserHoverTrigger} />
        )}

        {tab === "chat" && (
          <div>
            <h2>💬 Messagerie</h2>
            <Chat />
          </div>
        )}

        {tab === "messages" && (
          <MessagesTab msgStats={msgStats} users={users} UserHoverTrigger={UserHoverTrigger} />
        )}
      </DashboardLayout>

      <UserHoverPreview hoveredUserCard={hoveredUserCard} />
      <PreuveModal preuveModal={preuveModal} onClose={() => setPreuveModal(null)} />
    </ProtectedRoute>
  );
}
