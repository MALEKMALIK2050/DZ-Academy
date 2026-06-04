import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chat from "@/components/Chat";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import ProfileDropdown from "@/components/ProfileDropdown";

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth(); // ✅ récupérer authLoading

  const [loading,       setLoading]       = useState(true);
  const [catalogue,     setCatalogue]     = useState([]);
  const [enrollments,   setEnrollments]   = useState([]);
  const [messages,      setMessages]      = useState([]);
  const [tab,           setTab]           = useState("overview");
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");
  const [typePaiements, setTypePaiements] = useState({});

  const [filtreNiveau,  setFiltreNiveau]  = useState("");
  const [filtreAnnee,   setFiltreAnnee]   = useState("");
  const [filtreMatiere, setFiltreMatiere] = useState("");

  const [newMsg,     setNewMsg]     = useState({ receiverId: "", content: "" });
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchAll = async (niveau = "", annee = "", matiere = "") => {
    try {
      const params = new URLSearchParams();
      if (niveau)  params.append("niveau",  niveau);
      if (annee)   params.append("annee",   annee);
      if (matiere) params.append("matiere", matiere);

      const [cRes, mRes] = await Promise.all([
        fetch(`/api/student/courses?${params}`, { credentials: "include" }),
        fetch("/api/messages", { credentials: "include" }),
      ]);

      const cData = await cRes.json();
      const mData = await mRes.json();

      console.log("STATUS:", cRes.status);
      console.log("CDATA:", cData);
      console.log("CATALOGUE:", cData?.catalogue?.length);

      setCatalogue(Array.isArray(cData?.catalogue) ? cData.catalogue : []);
      setEnrollments(Array.isArray(cData?.enrollments) ? cData.enrollments : []);
      setMessages(Array.isArray(mData) ? mData : []);
    } catch (err) {
      console.error("fetchAll error:", err);
      setCatalogue([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ useEffect corrigé
  useEffect(() => {
    if (authLoading) return; // ✅ attendre que l'auth soit prête
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role?.toLowerCase() !== "student") {
      router.replace("/login");
      return;
    }
    fetchAll("", "", "");
  }, [user, authLoading]); // ✅ dépend de authLoading aussi

  const handleEnroll = async (courseId, typePaiement) => {
    setError(""); setSuccess("");
    try {
      const res = await fetch("/api/student/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, typePaiement }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Demande envoyée ! L'admin validera votre inscription après paiement.");
        fetchAll("", "", "");
      } else {
        setError(data.error || "Erreur inscription");
      }
    } catch { setError("Erreur serveur"); }
  };

  const handleUnenroll = async (courseId) => {
    if (!confirm("Annuler la demande d'inscription ?")) return;
    try {
      await fetch("/api/student/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId }),
      });
      fetchAll("", "", "");
    } catch {}
  };

  const handleSendMessage = async () => {
    if (!newMsg.receiverId || !newMsg.content) return;
    setSendingMsg(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newMsg),
      });
      if (res.ok) {
        setNewMsg({ ...newMsg, content: "" });
        fetchAll("", "", "");
      }
    } catch {}
    finally { setSendingMsg(false); }
  };

  const handleMarkRead = async (messageId) => {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ messageId }),
    });
    fetchAll("", "", "");
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

  // ✅ afficher chargement pendant auth ou fetch
  if (authLoading || loading) return <p>Chargement...</p>;

  const nonLus = messages.filter((m) => m.receiverId === user?.id && !m.lu).length;

  const conversations = messages.reduce((acc, m) => {
    const otherId = m.senderId === user?.id ? m.receiverId : m.senderId;
    const other   = m.senderId === user?.id ? m.receiver   : m.sender;
    if (!otherId) return acc;
    if (!acc[otherId]) acc[otherId] = { user: other, messages: [] };
    acc[otherId].messages.push(m);
    return acc;
  }, {});

  const teachers = [...new Map(
    enrollments
      .filter((e) => e.course?.teacher && e.statut === "PAYE")
      .map((e) => [e.course.teacher.id, e.course.teacher])
  ).values()];

  const anneesCollege = ["6eme", "5eme", "4eme", "3eme"];
  const anneesLycee   = ["1AS", "2AS", "Terminale"];

  const totalUnreadChat = messages.filter((m) => m.receiverId === user?.id && !m.lu).length;
  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace élève", icon: "🎓" },
    { key: "mes-cours", label: "Mes cours", icon: "📖", badge: enrollments.filter(e => e.statut === "PAYE" || e.statut === "GRATUIT").length },
    { key: "messages", label: "Messages", icon: "✉️", badge: nonLus },
    { key: "chat", label: "Chat", icon: "💬", badge: totalUnreadChat },
    { key: "catalogue", label: "Chercher plus de cours !", icon: "🔍", isFooter: true },
  ];

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎓"
        customTitle="Espace Élève"
        tabs={DASHBOARD_TABS}
        activeTab={tab}
        onTabChange={setTab}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "800", color: "#3b82f6" }}>
              👨‍🎓 Bienvenue <span style={{ color: "#3b82f6" }}>{user?.prenom}</span>!
            </h1>
            <p style={{ color: "#718096" }}>Explorez vos cours et progressez</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <ProfileDropdown userRole="STUDENT" />
          </div>
        </div>

        {tab === "overview" && (
          <div className="stats-grid">
            <div style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)", color: "white", padding: "1.5rem", borderRadius: "14px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>{enrollments.filter(e => e.statut === "PAYE" || e.statut === "GRATUIT").length}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Mes cours actifs</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#92400e,#d97706)", color: "white", padding: "1.5rem", borderRadius: "14px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>{enrollments.filter(e => e.statut === "EN_ATTENTE").length}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>En attente</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#065f46,#059669)", color: "white", padding: "1.5rem", borderRadius: "14px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>{enrollments.filter(e => e.completed).length}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Cours terminés</div>
            </div>
            <div style={{ background: nonLus > 0 ? "linear-gradient(135deg,#991b1b,#dc2626)" : "linear-gradient(135deg,#334155,#475569)", color: "white", padding: "1.5rem", borderRadius: "14px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>{nonLus}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Messages non lus</div>
            </div>
          </div>
        )}

        {error   && <p style={{ color: "red",   background: "#fff5f5", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>{error}</p>}
        {success && <p style={{ color: "green", background: "#f0fff4", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>{success}</p>}

        {/* ── Tab : Mes cours ── */}
        {tab === "mes-cours" && (
          <div>
            {enrollments.filter((e) => e.statut === "EN_ATTENTE").length > 0 && (
              <div style={{ background: "#fffbeb", border: "2px solid #f6e05e", padding: "2rem", borderRadius: "10px", marginBottom: "2rem" }}>
                <h2 style={{ margin: "0 0 1.25rem", color: "#744210" }}>⏳ Demandes en attente de validation</h2>
                {enrollments.filter((e) => e.statut === "EN_ATTENTE").map((e) => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #fef08a" }}>
                    <div>
                      <strong>{e.course.title}</strong>
                      <span style={{ marginLeft: "1rem", fontSize: "1.25rem", color: "#92400e" }}>
                        ({e.typePaiement === "PARCOURS_COMPLET" ? "Parcours complet" : "Cours seul"})
                      </span>
                    </div>
                    <button onClick={() => handleUnenroll(e.course.id)} style={{ background: "none", border: "1px solid #d97706", color: "#92400e", padding: "0.3rem 0.7rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                      Annuler
                    </button>
                  </div>
                ))}
              </div>
            )}

            {enrollments.filter((e) => e.statut === "PAYE" || e.statut === "GRATUIT").length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>
                <p style={{ fontSize: "1.2rem" }}>Vous n'avez aucun cours actif.</p>
                <button onClick={() => setTab("catalogue")} style={btnPrimary}>
                  🔍 Parcourir le catalogue
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {enrollments.filter((e) => e.statut === "PAYE" || e.statut === "GRATUIT").map((e) => (
                  <div key={e.id} style={{ background: "#f7fafc", padding: "1.25rem", borderRadius: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem" }}>{e.course.title}</strong>
                        <div style={{ fontSize: "1rem", color: "#718096", marginTop: "1rem" }}>
                          {[e.course.matiere, e.course.niveau, e.course.annee].filter(Boolean).join(" • ")}
                        </div>
                        {e.course.teacher && (
                          <div style={{ fontSize: "1rem", color: "#718096" }}>
                            👨‍🏫 {e.course.teacher.prenom} {e.course.teacher.nom}
                          </div>
                        )}
                        <span style={{ background: e.statut === "GRATUIT" ? "#0ea5e9" : "#059669", color: "white", padding: "0.1rem 0.5rem", borderRadius: "10px", fontSize: "0.75rem" }}>
                          {e.statut === "GRATUIT" ? "Gratuit" : "Payé"}
                        </span>
                      </div>
                      <button onClick={() => router.push(`/dashboard/student/courses/${e.course.id}`)} style={btnPrimary}>
                        📖 Commencer 
                      </button>
                    </div>
                    <div style={{ marginTop: "2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                        <span>Progression</span>
                        <span style={{ fontWeight: "bold" }}>{e.progression}%</span>
                      </div>
                      <div style={{ background: "#e2e8f0", borderRadius: "10px", height: "8px", overflow: "hidden" }}>
                        <div style={{
                          background: e.progression === 100 ? "#059669" : e.progression > 50 ? "#1e40af" : "#d97706",
                          width: `${e.progression}%`, height: "100%", transition: "width 0.3s"
                        }} />
                      </div>
                      {e.completed && <p style={{ color: "#10B981", fontSize: "0.85rem", marginTop: "0.25rem" }}>✅ Cours complété !</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab : Catalogue ── */}
        {tab === "catalogue" && (
          <div>
            <div style={{ background: "#f7fafc", padding: "1.50rem", borderRadius: "15px", marginBottom: "2rem" }}>
              <h3 style={{ margin: "0 0 1.25rem" }}>🔍 Filtrer les cours</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={labelStyle}>Niveau</label>
                  <select value={filtreNiveau} onChange={(e) => setFiltreNiveau(e.target.value)} style={inputStyle}>
                    <option value="">Tous les niveaux</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Année</label>
                  <select value={filtreAnnee} onChange={(e) => setFiltreAnnee(e.target.value)} style={inputStyle}>
                    <option value="">Toutes les années</option>
                    {filtreNiveau === "college" && anneesCollege.map((a) => <option key={a} value={a}>{a}</option>)}
                    {filtreNiveau === "lycee"   && anneesLycee.map((a)   => <option key={a} value={a}>{a}</option>)}
                    {!filtreNiveau && [...anneesCollege, ...anneesLycee].map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Matière</label>
                  <select value={filtreMatiere} onChange={(e) => setFiltreMatiere(e.target.value)} style={inputStyle}>
                    <option value="">Toutes les matières</option>
                    {["Mathématiques", "Physique", "SVT", "Informatique & Programmation","Philosophie","Histoire & Géographie", "Arabe", "Education islamique","Français", "Anglais", "Espagnol", ].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  console.log("recherche:", filtreNiveau, filtreAnnee, filtreMatiere);
                  fetchAll(filtreNiveau, filtreAnnee, filtreMatiere);
                }}
                style={{ background: "linear-gradient(135deg,#065f46,#059669)", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "1rem", width: "100%", fontSize: "1rem" }}
              >
                🔍 Rechercher
              </button>
            </div>

            {catalogue.length === 0 ? (
              <p style={{ color: "#718096", textAlign: "center" }}>Aucun cours disponible avec ces filtres.</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {catalogue.map((c) => {
                  const enrollment = c.enrollments?.[0];
                  return (
                    <div key={c.id} style={{ background: "#f7fafc", padding: "1.25rem", borderRadius: "10px", border: enrollment ? "2px solid #38a169" : "2px solid transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ fontSize: "1.1rem" }}>{c.title}</strong>
                          <div style={{ fontSize: "0.85rem", color: "#718096", marginTop: "0.25rem" }}>
                            {[c.matiere, c.niveau, c.annee].filter(Boolean).join(" • ")}
                          </div>
                          {c.description && <p style={{ fontSize: "0.9rem", color: "#4a5568", marginTop: "0.5rem" }}>{c.description}</p>}
                          <div style={{ fontSize: "0.85rem", color: "#718096", marginTop: "0.25rem" }}>
                            📚 {c.chapters?.length || 0} chapitre(s)
                            {c.teacher && ` • 👨‍🏫 ${c.teacher.prenom} ${c.teacher.nom}`}
                          </div>
                        </div>
                        <div style={{ minWidth: "180px" }}>
                          {!enrollment && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <select
                                value={typePaiements[c.id] || "COURS_SEUL"}
                                onChange={(e) => setTypePaiements({ ...typePaiements, [c.id]: e.target.value })}
                                style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "0.85rem", width: "100%" }}
                              >
                                <option value="COURS_SEUL">💳 Ce cours uniquement</option>
                                <option value="PARCOURS_COMPLET">🎓 Parcours complet</option>
                              </select>
                              <button onClick={() => handleEnroll(c.id, typePaiements[c.id] || "COURS_SEUL")} style={btnSuccess}>
                                ➕ Demander l'accès
                              </button>
                            </div>
                          )}
                          {enrollment?.statut === "EN_ATTENTE" && (
                            <span style={{ background: "#e48341", color: "white", padding: "0.4rem 0.8rem", borderRadius: "10px", fontSize: "0.85rem", display: "block", textAlign: "center" }}>
                              ⏳ En attente
                            </span>
                          )}
                          {enrollment?.statut === "REJETE" && (
                            <span style={{ background: "#e53e3e", color: "white", padding: "0.4rem 0.8rem", borderRadius: "10px", fontSize: "0.85rem", display: "block", textAlign: "center" }}>
                              ❌ Rejeté
                            </span>
                          )}
                          {(enrollment?.statut === "PAYE" || enrollment?.statut === "GRATUIT") && (
                            <button onClick={() => router.push(`/dashboard/student/courses/${c.id}`)} style={btnPrimary}>
                              📖 Accéder au cours
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab : Messages ── */}
        {tab === "messages" && (
          <div>
            <div style={{ background: "#f7fafc", padding: "1.25rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1rem" }}>✉️ Contacter un enseignant</h3>
              {teachers.length === 0 ? (
                <p style={{ color: "#718096" }}>Inscrivez-vous à un cours pour contacter son enseignant.</p>
              ) : (
                <>
                  <select value={newMsg.receiverId} onChange={(e) => setNewMsg({ ...newMsg, receiverId: e.target.value })} style={inputStyle}>
                    <option value="">Choisir un enseignant...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Votre message..."
                    value={newMsg.content}
                    onChange={(e) => setNewMsg({ ...newMsg, content: e.target.value })}
                    style={{ ...inputStyle, height: "80px", resize: "vertical", marginTop: "0.75rem" }}
                  />
                  <button onClick={handleSendMessage} disabled={sendingMsg} style={{ ...btnPrimary, marginTop: "0.75rem" }}>
                    {sendingMsg ? "Envoi..." : "📤 Envoyer"}
                  </button>
                </>
              )}
            </div>

            <h3>💬 Conversations</h3>
            {Object.keys(conversations).length === 0 ? (
              <p style={{ color: "#718096" }}>Aucune conversation.</p>
            ) : (
              Object.entries(conversations).map(([otherId, conv]) => (
                <div key={otherId} style={{ background: "#f7fafc", borderRadius: "10px", marginBottom: "1rem", overflow: "hidden" }}>
                  <div style={{ background: "#edf2f7", padding: "0.75rem 1rem", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
                    <span>
                      {conv.user?.prenom} {conv.user?.nom}
                      <span style={{ fontSize: "0.8rem", color: "#718096", marginLeft: "0.5rem" }}>({conv.user?.role})</span>
                    </span>
                    {conv.messages.filter((m) => m.receiverId === user?.id && !m.lu).length > 0 && (
                      <span style={{ background: "#e53e3e", color: "white", padding: "0.1rem 0.5rem", borderRadius: "10px", fontSize: "0.8rem" }}>
                        {conv.messages.filter((m) => m.receiverId === user?.id && !m.lu).length} non lu
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "1rem", maxHeight: "250px", overflowY: "auto" }}>
                    {conv.messages
                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                      .map((m) => (
                        <div key={m.id} style={{ display: "flex", justifyContent: m.senderId === user?.id ? "flex-end" : "flex-start", marginBottom: "0.5rem" }}>
                          <div style={{
                            background: m.senderId === user?.id ? "#1e40af" : "#e2e8f0",
                            color: m.senderId === user?.id ? "white" : "#1e293b",
                            padding: "0.5rem 0.8rem", borderRadius: "12px", maxWidth: "70%", fontSize: "0.9rem",
                          }}>
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

        {/* ── Tab : Chat ── */}
        {tab === "chat" && (
          <div>
            <h3>💬 Chat</h3>
            <Chat />
          </div>
        )}

      </DashboardLayout>
    </ProtectedRoute>
  );
}

const labelStyle  = { display: "block", marginBottom: "0.3rem", fontWeight: "600", color: "#4a5568" };
const inputStyle  = { width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" };
const btnPrimary  = { background: "linear-gradient(135deg,#1e3a5f,#1e40af)", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 12px rgba(30,64,175,0.3)" };
const btnSuccess  = { background: "linear-gradient(135deg,#065f46,#059669)", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const btnDanger   = { background: "linear-gradient(135deg,#991b1b,#dc2626)", color: "white", padding: "0.5rem 1rem",    border: "none", borderRadius: "8px",  cursor: "pointer" };