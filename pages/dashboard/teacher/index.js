import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileDropdown from "@/components/ProfileDropdown";
import { io } from "socket.io-client";
import Chat from "@/components/Chat";
import DashboardLayout from "../../../components/layout/DashboardLayout";

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [studentStats, setStudentStats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [newMsg, setNewMsg] = useState({ receiverId: "", content: "" });
  const [sendingMsg, setSendingMsg] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (user.role?.toLowerCase() !== "teacher") {
      router.replace("/login");
      return;
    }
    fetchAll();
    initSocket();
    return () => { socketRef.current?.disconnect(); };
  }, [user]);

  const initSocket = async () => {
    await fetch("/api/socket");
    const socket = io({ path: "/api/socket", addTrailingSlash: false });
    socketRef.current = socket;
    socket.on("connect", () => console.log("🟢 Socket connecté"));
  };

  const fetchAll = async () => {
    try {
      const [cRes, sRes, mRes, nRes] = await Promise.all([
        fetch("/api/teacher/courses", { credentials: "include" }),
        fetch("/api/teacher/students", { credentials: "include" }),
        fetch("/api/messages", { credentials: "include" }),
        fetch("/api/notifications", { credentials: "include" }),
      ]);
      setCourses(Array.isArray(await cRes.json()) ? await cRes.json() : []);
      const sData = await sRes.json();
      setStudentStats(Array.isArray(sData?.studentStats) ? sData.studentStats : []);
      setMessages(Array.isArray(await mRes.json()) ? await mRes.json() : []);
      setNotifications(Array.isArray(await nRes.json()) ? await nRes.json() : []);
    } catch (err) {
      console.error("Erreur fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const receiverId = selectedStudent?.student?.id || newMsg.receiverId;
    const content = newMsg.content;
    if (!receiverId || !content) return;
    
    setSendingMsg(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId, content }),
      });
      if (res.ok) {
        setNewMsg({ ...newMsg, content: "" });
        fetchAll();
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) return <p>Chargement...</p>;

  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace Teacher", icon: "👨‍🏫" },
    { key: "courses", label: "Mes cours", icon: "📚", badge: courses.length },
    { key: "students", label: "Mes élèves", icon: "👨‍🎓", badge: studentStats.length },
    { key: "messages", label: "Messages", icon: "✉️", badge: messages.filter(m => m.receiverId === user?.id && !m.lu).length },
    { key: "chat", label: "Chat", icon: "💬" },
  ];

  return (
    <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
      <DashboardLayout
        user={user}
        roleIcon="👨‍🏫"
        customTitle="Espace Enseignant"
        tabs={DASHBOARD_TABS}
        activeTab={tab}
        onTabChange={setTab}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "800", color: "#059669" }}>
              👨‍🏫 Dashboard Enseignant
            </h1>
            <p style={{ color: "#718096" }}>Gérez vos cours et élèves</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: "#edf2f7", border: "none", borderRadius: "8px", padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "1.2rem" }}>
                🔔 {notifications.filter(n => !n.lu).length}
              </button>
              {showNotifs && (
                <div style={{ position: "absolute", right: 0, top: "110%", width: "300px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 100 }}>
                  <div style={{ padding: "1rem", maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.length === 0 ? <p style={{ color: "#718096" }}>Aucune notification</p> : notifications.map(n => (
                      <div key={n.id} style={{ padding: "0.5rem", borderBottom: "1px solid #f0f0f0", fontSize: "0.9rem" }}>{n.contenu}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ProfileDropdown userRole="TEACHER" />
          </div>
        </div>

        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            {[
              { label: "📚 Cours", count: courses.length, color: "#3182ce" },
              { label: "👨‍🎓 Élèves", count: studentStats.length, color: "#059669" },
              { label: "💬 Messages", count: messages.length, color: "#dd6b20" },
              { label: "🔔 Notifications", count: notifications.length, color: "#805ad5" },
            ].map((s) => (
              <div key={s.label} style={{ background: s.color, color: "white", padding: "1.5rem", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{s.count}</div>
                <div style={{ fontSize: "0.9rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "courses" && (
          <div>
            {courses.length === 0 ? (
              <p style={{ color: "#718096" }}>Aucun cours assigné</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {courses.map((c) => (
                  <div key={c.id} style={{ background: "#f7fafc", padding: "1.25rem", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "1.1rem" }}>{c.title}</strong>
                      <div style={{ fontSize: "0.85rem", color: "#718096", marginTop: "0.25rem" }}>
                        {c.matiere} • {c.niveau} • {c.enrollments?.length || 0} élèves
                      </div>
                    </div>
                    <button onClick={() => router.push(`/dashboard/teacher/courses/${c.id}`)} style={{ background: "#059669", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
                      👁 Voir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "students" && (
          <div>
            {studentStats.length === 0 ? (
              <p style={{ color: "#718096" }}>Aucun élève</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {studentStats.map((s) => (
                  <div key={s.student?.id} style={{ background: "#f7fafc", padding: "1.25rem", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{s.student?.prenom} {s.student?.nom}</strong>
                      <div style={{ fontSize: "0.85rem", color: "#718096" }}>{s.student?.email}</div>
                    </div>
                    <button onClick={() => setSelectedStudent(s)} style={{ background: "#059669", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
                      👁 Fiche
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "messages" && (
          <div>
            <h3>✉️ Nouveau message</h3>
            <select value={newMsg.receiverId} onChange={(e) => setNewMsg({ ...newMsg, receiverId: e.target.value })} style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #cbd5e0" }}>
              <option value="">Choisir un contact...</option>
              {studentStats.map((s) => <option key={s.student?.id} value={s.student?.id}>{s.student?.prenom} {s.student?.nom}</option>)}
            </select>
            <textarea placeholder="Message..." value={newMsg.content} onChange={(e) => setNewMsg({ ...newMsg, content: e.target.value })} style={{ width: "100%", padding: "0.75rem", minHeight: "100px", borderRadius: "6px", border: "1px solid #cbd5e0", marginBottom: "1rem" }} />
            <button onClick={handleSendMessage} disabled={sendingMsg} style={{ background: "#059669", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
              {sendingMsg ? "Envoi..." : "📤 Envoyer"}
            </button>
          </div>
        )}

        {tab === "chat" && <Chat />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}