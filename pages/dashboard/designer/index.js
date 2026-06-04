import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chat from "@/components/Chat";
import ProfileDropdown from "@/components/ProfileDropdown";
import DashboardLayout from "../../../components/layout/DashboardLayout";

export default function DesignerDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 20;

  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [newMsg, setNewMsg] = useState({ receiverId: "", content: "" });
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState("");
  const [msgError, setMsgError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cRes, mRes, ctRes] = await Promise.all([
          fetch("/api/designer/courses", { credentials: "include" }),
          fetch("/api/messages", { credentials: "include" }),
          fetch("/api/chat/contacts", { credentials: "include" }),
        ]);

        const cData = await cRes.json();
        const mData = await mRes.json();
        const ctData = await ctRes.json();

        setCourses(Array.isArray(cData) ? cData : []);
        setMessages(Array.isArray(mData) ? mData : []);
        setContacts(Array.isArray(ctData.contacts) ? ctData.contacts : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady && user?.id) {
      fetchAll();
    }
  }, [router.isReady, user]);

  const handleSendMessage = async () => {
    setMsgError("");
    setMsgSuccess("");

    if (!newMsg.receiverId || !newMsg.content) {
      return setMsgError("Destinataire et message obligatoires");
    }

    setSendingMsg(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newMsg),
      });

      const data = await res.json();

      if (res.ok) {
        setMsgSuccess("✅ Message envoyé !");
        setNewMsg({ ...newMsg, content: "" });
        setMessages((prev) => [...prev, data]);
      } else {
        setMsgError(data.error || "Erreur envoi");
      }
    } catch {
      setMsgError("Erreur serveur");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleMarkRead = async (messageId) => {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ messageId }),
    });

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, lu: true } : m
      )
    );
  };
  

  // Socket pour les badges en temps réel
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/socket").then(() => {
      const s = io({ path: "/api/socket" });
      setSocket(s);
      s.on("connect", () => {
        const token = document.cookie.match(/token=([^;]+)/)?.[1];
        if (token) s.emit("identify", { token });
      });
      s.on("unread_update", ({ senderId, unreadCount }) => {
        if (unreadCount === 0) {
          setMessages(prev => prev.map(m => (m.senderId === senderId && m.receiverId === user.id) ? { ...m, lu: true } : m));
        }
      });
      s.on("private_message", (msg) => {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });
      return () => s.disconnect();
    });
  }, [user?.id]);

  // Marquer messages comme lus quand on ouvre le tab Chat
  useEffect(() => {
    if (tab === "chat" && messages.length > 0) {
      const unreadMessages = messages.filter((m) => m.receiverId === user?.id && !m.lu);
      if (unreadMessages.length > 0) {
        const senderIds = [...new Set(unreadMessages.map(m => m.senderId))];
        senderIds.forEach(sId => {
          socket?.emit("mark_read", { userId: user.id, contactId: sId });
        });
        setMessages((prev) => prev.map((m) => m.receiverId === user?.id ? { ...m, lu: true } : m));
      }
    }
  }, [tab, messages.length, socket]);

  if (loading) return <p>Chargement...</p>;

  const published = courses.filter((c) => c.status === "PUBLISHED");
  const drafts = courses.filter((c) => c.status === "DRAFT");

  const nonLus = messages.filter(
    (m) => m.receiverId === user?.id && !m.lu
  ).length;

  const conversations = messages.reduce((acc, m) => {
    const otherId =
      m.senderId === user?.id ? m.receiverId : m.senderId;

    const other =
      m.senderId === user?.id ? m.receiver : m.sender;

    if (!otherId) return acc;

    if (!acc[otherId]) {
      acc[otherId] = {
        user: other,
        messages: [],
      };
    }

    acc[otherId].messages.push(m);

    return acc;
  }, {});

  const totalUnreadChat = messages.filter((m) => m.receiverId === user?.id && !m.lu).length;
  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace Designer", icon: "🎨" },
    { key: "courses", label: "Mes cours", icon: "🎨", badge: courses.length },
    { key: "messages", label: "Messages", icon: "✉️", badge: nonLus },
    { key: "chat", label: "Chat", icon: "💬", badge: totalUnreadChat },
  ];

  return (
    <ProtectedRoute allowedRoles={["DESIGNER", "ADMIN"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎨"
        customTitle="Espace Designer"
        tabs={DASHBOARD_TABS}
        activeTab={tab}
        onTabChange={setTab}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: "2.5rem", 
              fontWeight: "800"
            }}>
              🎨 Bienvenue <span style={{ color: "#8b5cf6" }}>{user?.prenom}</span>!
            </h1>
            <p style={{ color: "#718096" }}>Gérez vos cours et contenus pédagogiques</p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <ProfileDropdown userRole="DESIGNER" />
            <button 
              onClick={() => router.push("/dashboard/designer/courses/create")} 
              style={{ 
                ...btnPrimary, 
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                boxShadow: "0 10px 20px rgba(139, 92, 246, 0.2)"
              }}
            >
              ➕ Créer un cours
            </button>
          </div>
        </div>

        {tab === "overview" && (
          <div className="stats-grid">
            <div style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "white", padding: "1.5rem", borderRadius: "14px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>{courses.length}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Total Cours</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)", color: "white", padding: "1.5rem", borderRadius: "14px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>{published.length}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Publiés</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", padding: "1.5rem", borderRadius: "14px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>{drafts.length}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Brouillons</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", padding: "1.5rem", borderRadius: "14px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>{nonLus}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Messages non lus</div>
            </div>
          </div>
        )}

        {tab === "courses" && (
          <div>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
              <h2>📚 Mes cours créés ({courses.length})</h2>
            </div>

            {courses.length === 0 ? (
              <p style={{ color: "#475569" }}>Aucun cours créé — commencez par créer votre premier cours !</p>
            ) : (
              <>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {courses.slice((currentPage - 1) * coursesPerPage, currentPage * coursesPerPage).map((c) => (
                    <div key={c.id} style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0" }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem" }}>{c.title}</strong>
                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                          {c.matiere} • {c.niveau} • {c.annee}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <span style={{ background: c.status === "PUBLISHED" ? "#059669" : "#d97706", color: "white", padding: "0.2rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600" }}>
                          {c.status}
                        </span>
                        <button onClick={() => router.push(`/dashboard/designer/courses/${c.id}`)} style={{ ...btnSmall, background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                          ⚙️ Gérer
                        </button>
                        <button onClick={() => router.push(`/dashboard/designer/courses/edit/${c.id}`)} style={{ ...btnSmall, background: "#06b6d4" }}>
                          ✏️ Modifier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {Math.ceil(courses.length / coursesPerPage) > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
                    {[...Array(Math.ceil(courses.length / coursesPerPage)).keys()].map((page) => (
                      <button
                        key={page + 1}
                        onClick={() => setCurrentPage(page + 1)}
                        style={{
                          padding: "0.5rem 1rem",
                          border: currentPage === page + 1 ? "none" : "1px solid #cbd5e0",
                          background: currentPage === page + 1 ? "#8b5cf6" : "white",
                          color: currentPage === page + 1 ? "white" : "#475569",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600"
                        }}
                      >
                        {page + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "messages" && (
          <div>
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 1rem" }}>✉️ Nouveau message</h3>
              {msgError && <p style={{ color: "red", background: "#fff5f5", padding: "0.5rem", borderRadius: "6px" }}>{msgError}</p>}
              {msgSuccess && <p style={{ color: "green", background: "#f0fff4", padding: "0.5rem", borderRadius: "6px" }}>{msgSuccess}</p>}
              
              <select
                value={newMsg.receiverId}
                onChange={(e) => setNewMsg({ ...newMsg, receiverId: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "6px", marginBottom: "0.75rem" }}
              >
                <option value="">Choisir un contact...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.role})</option>
                ))}
              </select>

              <textarea
                placeholder="Votre message..."
                value={newMsg.content}
                onChange={(e) => setNewMsg({ ...newMsg, content: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "6px", height: "80px", resize: "vertical" }}
              />

              <button onClick={handleSendMessage} disabled={sendingMsg} style={{ ...btnPrimary, marginTop: "0.75rem" }}>
                {sendingMsg ? "Envoi..." : "📤 Envoyer"}
              </button>
            </div>

            <h3>💬 Conversations</h3>
            {Object.keys(conversations).length === 0 ? (
              <p style={{ color: "#475569" }}>Aucune conversation.</p>
            ) : (
              Object.entries(conversations).map(([otherId, conv]) => (
                <div key={otherId} style={{ background: "#f8fafc", borderRadius: "12px", marginBottom: "1rem", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  <div style={{ background: "#f1f5f9", padding: "0.75rem 1rem", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
                    <span>{conv.user?.prenom} {conv.user?.nom} <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "0.5rem" }}>({conv.user?.role})</span></span>
                    {conv.messages.filter(m => m.receiverId === user?.id && !m.lu).length > 0 && (
                      <span style={{ background: "#dc2626", color: "white", padding: "0.1rem 0.5rem", borderRadius: "10px", fontSize: "0.8rem" }}>
                        {conv.messages.filter(m => m.receiverId === user?.id && !m.lu).length} non lu
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "1rem", maxHeight: "250px", overflowY: "auto" }}>
                    {conv.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((m) => (
                      <div key={m.id} style={{ display: "flex", justifyContent: m.senderId === user?.id ? "flex-end" : "flex-start", marginBottom: "0.5rem" }}>
                        <div style={{ background: m.senderId === user?.id ? "#8b5cf6" : "#e2e8f0", color: m.senderId === user?.id ? "white" : "#1e293b", padding: "0.5rem 0.8rem", borderRadius: "12px", maxWidth: "70%", fontSize: "0.9rem" }}>
                          {m.content}
                          <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "0.2rem" }}>
                            {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                            {m.receiverId === user?.id && !m.lu && (
                              <button onClick={() => handleMarkRead(m.id)} style={{ marginLeft: "0.5rem", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "0.7rem" }}>
                                ✓ Lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "chat" && (
          <div>
            <h2>💬 Messagerie</h2>
            <Chat />
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div
      style={{
        background: color,
        color: "white",
        padding: "1.25rem",
        borderRadius: "14px",
        textAlign: "center",
        boxShadow:
          "0 4px 15px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          fontSize: "2rem",
          fontWeight: "800",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: "0.85rem",
          marginTop: "0.3rem",
          opacity: 0.9,
        }}
      >
        {label}
      </div>
    </div>
  );
}

const btnPrimary = {
  background:
    "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  padding: "0.75rem 1.5rem",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  boxShadow:
    "0 4px 12px rgba(139, 92, 246, 0.3)",
};

const btnSecondary = {
  background: "#f1f5f9",
  color: "#475569",
  padding: "0.75rem 1.5rem",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "500",
};

const btnDanger = {
  background:
    "linear-gradient(135deg,#991b1b,#dc2626)",
  color: "white",
  padding: "0.5rem 1rem",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const btnSmall = {
  background:
    "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  padding: "0.3rem 0.9rem",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "0.85rem",
};