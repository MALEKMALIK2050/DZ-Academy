import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chat from "@/components/Chat";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import ProfileDropdown from "@/components/ProfileDropdown";
import { MATIERES, NIVEAUX, ANNEES_COLLEGE, ANNEES_LYCEE, getMatiereLabel, getNiveauLabel } from "@/lib/constants";

// 🎨 Couleurs du LMS
const COLORS = {
  green: {
    light: "#ecfdf5",
    DEFAULT: "#059669",
    hover: "#047857",
    gradient: "linear-gradient(135deg, #059669, #10b981)",
  },
  orange: {
    light: "#fffbeb",
    DEFAULT: "#f59e0b",
    hover: "#d97706",
    text: "#92400e",
  },
  blue: {
    light: "#eff6ff",
    DEFAULT: "#1e40af",
    hover: "#1e3a5f",
    gradient: "linear-gradient(135deg, #1e3a5f, #1e40af)",
  },
  text: {
    primary: "#1f2937",
    secondary: "#6b7280",
  },
  border: "#e2e8f0",
  error: "#ef4444",
  success: "#059669",
};

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  // États existants
  const [loading, setLoading] = useState(true);
  const [catalogue, setCatalogue] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [typePaiements, setTypePaiements] = useState({});

  // ✅ ÉTATS POUR LES FILTRES DU CATALOGUE
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [filtreAnnee, setFiltreAnnee] = useState("");
  const [filtreMatiere, setFiltreMatiere] = useState("");
  const [catalogueLoading, setCatalogueLoading] = useState(false);

  // États pour les messages
  const [newMsg, setNewMsg] = useState({ receiverId: "", content: "" });
  const [sendingMsg, setSendingMsg] = useState(false);

  // ✅ FONCTION POUR RECHERCHER LES COURS (CATALOGUE)
  const fetchCatalogueCourses = async (niveau = "", annee = "", matiere = "") => {
    setCatalogueLoading(true);
    try {
      const params = new URLSearchParams();
      if (niveau) params.append("niveau", niveau);
      if (annee) params.append("annee", annee);
      if (matiere) params.append("matiere", matiere);

      const res = await fetch(`/api/courses/public?${params.toString()}`);
      const data = await res.json();
      setCatalogue(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchCatalogueCourses error:", err);
      setCatalogue([]);
    } finally {
      setCatalogueLoading(false);
    }
  };

  const fetchAll = async (niveau = "", annee = "", matiere = "") => {
    try {
      const params = new URLSearchParams();
      if (niveau) params.append("niveau", niveau);
      if (annee) params.append("annee", annee);
      if (matiere) params.append("matiere", matiere);

      const [cRes, mRes] = await Promise.all([
        fetch(`/api/student/courses?${params}`, { credentials: "include" }),
        fetch("/api/messages", { credentials: "include" }),
      ]);

      const cData = await cRes.json();
      const mData = await mRes.json();

      setEnrollments(Array.isArray(cData?.enrollments) ? cData.enrollments : []);
      setMessages(Array.isArray(mData) ? mData : []);
    } catch (err) {
      console.error("fetchAll error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CHARGER LE CATALOGUE QUAND L'ONGLET CHANGE
  useEffect(() => {
    if (tab === "catalogue") {
      fetchCatalogueCourses(filtreNiveau, filtreAnnee, filtreMatiere);
    }
  }, [tab]);

  // ✅ useEffect principal
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role?.toLowerCase() !== "student") {
      router.replace("/login");
      return;
    }
    fetchAll("", "", "");
    fetchCatalogueCourses("", "", "");
  }, [user, authLoading]);

  // ✅ GESTIONNAIRES DE RECHERCHE
  const handleCatalogueSearch = () => {
    fetchCatalogueCourses(filtreNiveau, filtreAnnee, filtreMatiere);
  };

  const handleCatalogueReset = () => {
    setFiltreNiveau("");
    setFiltreAnnee("");
    setFiltreMatiere("");
    fetchCatalogueCourses("", "", "");
  };

  const handleEnroll = async (courseId, typePaiement) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/student/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, typePaiement }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetch("/api/notifications/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ courseId, type: "DEMANDE_INSCRIPTION" }),
        });
        setSuccess("✅ Demande envoyée ! L'admin validera votre inscription.");
        fetchAll("", "", "");
        fetchCatalogueCourses(filtreNiveau, filtreAnnee, filtreMatiere);
      } else {
        setError(data.error || "Erreur inscription");
      }
    } catch {
      setError("Erreur serveur");
    }
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
      fetchCatalogueCourses(filtreNiveau, filtreAnnee, filtreMatiere);
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
    } catch {
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
    fetchAll("", "", "");
  };

  // Socket
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
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === senderId && m.receiverId === user.id
                ? { ...m, lu: true }
                : m
            )
          );
        }
      });
      s.on("private_message", (msg) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });
      return () => s.disconnect();
    });
  }, [user?.id]);

  useEffect(() => {
    if (tab === "chat" && messages.length > 0) {
      const unreadMessages = messages.filter((m) => m.receiverId === user?.id && !m.lu);
      if (unreadMessages.length > 0) {
        const senderIds = [...new Set(unreadMessages.map((m) => m.senderId))];
        senderIds.forEach((sId) => {
          socket?.emit("mark_read", { userId: user.id, contactId: sId });
        });
        setMessages((prev) =>
          prev.map((m) => (m.receiverId === user?.id ? { ...m, lu: true } : m))
        );
      }
    }
  }, [tab, messages.length, socket]);

  if (authLoading || loading) return <p>Chargement...</p>;

  const nonLus = messages.filter((m) => m.receiverId === user?.id && !m.lu).length;

  const conversations = messages.reduce((acc, m) => {
    const otherId = m.senderId === user?.id ? m.receiverId : m.senderId;
    const other = m.senderId === user?.id ? m.receiver : m.sender;
    if (!otherId) return acc;
    if (!acc[otherId]) acc[otherId] = { user: other, messages: [] };
    acc[otherId].messages.push(m);
    return acc;
  }, {});

  const teachers = [
    ...new Map(
      enrollments
        .filter((e) => e.course?.teacher && e.statut === "PAYE")
        .map((e) => [e.course.teacher.id, e.course.teacher])
    ).values(),
  ];

  const totalUnreadChat = messages.filter((m) => m.receiverId === user?.id && !m.lu)
    .length;

  const DASHBOARD_TABS = [
    { key: "overview", label: "Espace élève", icon: "🎓" },
    {
      key: "mes-cours",
      label: "Mes cours",
      icon: "📖",
      badge: enrollments.filter((e) => e.statut === "PAYE" || e.statut === "GRATUIT")
        .length,
    },
    { key: "messages", label: "Messages", icon: "✉️", badge: nonLus },
    { key: "chat", label: "Chat", icon: "💬", badge: totalUnreadChat },
    { key: "catalogue", label: "Chercher plus de cours !", icon: "🔍", isFooter: true },
  ];

  // Styles réutilisables
  const labelStyle = {
    display: "block",
    marginBottom: "0.3rem",
    fontWeight: "600",
    color: COLORS.text.primary,
    fontSize: "0.85rem",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.6rem",
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: "8px",
    fontSize: "0.95rem",
    boxSizing: "border-box",
    background: "white",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const btnPrimary = {
    background: COLORS.blue.gradient,
    color: "white",
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(30,64,175,0.3)",
  };

  const btnSuccess = {
    background: COLORS.green.gradient,
    color: "white",
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
  };

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "2.5rem",
                fontWeight: "800",
                color: COLORS.text.primary,
              }}
            >
              👨‍🎓 Bienvenue{" "}
              <span style={{ color: COLORS.green.DEFAULT }}>{user?.prenom}</span>!
            </h1>
            <p style={{ color: COLORS.text.secondary }}>
              Explorez vos cours et progressez
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <ProfileDropdown userRole="STUDENT" />
          </div>
        </div>

        {tab === "overview" && (
          <div className="stats-grid">
            <div
              style={{
                background: COLORS.blue.gradient,
                color: "white",
                padding: "1.5rem",
                borderRadius: "14px",
                textAlign: "center",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>
                {enrollments.filter((e) => e.statut === "PAYE" || e.statut === "GRATUIT")
                  .length}
              </div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Mes cours actifs</div>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg,#92400e,#d97706)",
                color: "white",
                padding: "1.5rem",
                borderRadius: "14px",
                textAlign: "center",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>
                {enrollments.filter((e) => e.statut === "EN_ATTENTE").length}
              </div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>En attente</div>
            </div>
            <div
              style={{
                background: COLORS.green.gradient,
                color: "white",
                padding: "1.5rem",
                borderRadius: "14px",
                textAlign: "center",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>
                {enrollments.filter((e) => e.completed).length}
              </div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Cours terminés</div>
            </div>
            <div
              style={{
                background:
                  nonLus > 0
                    ? "linear-gradient(135deg,#991b1b,#dc2626)"
                    : "linear-gradient(135deg,#334155,#475569)",
                color: "white",
                padding: "1.5rem",
                borderRadius: "14px",
                textAlign: "center",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "2.2rem", fontWeight: "800" }}>{nonLus}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Messages non lus</div>
            </div>
          </div>
        )}

        {error && (
          <p
            style={{
              color: COLORS.error,
              background: "#fef2f2",
              padding: "0.75rem",
              borderRadius: "6px",
              marginBottom: "1rem",
            }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            style={{
              color: COLORS.success,
              background: "#f0fdf4",
              padding: "0.75rem",
              borderRadius: "6px",
              marginBottom: "1rem",
            }}
          >
            {success}
          </p>
        )}

        {/* ── Tab : Mes cours ── */}
        {tab === "mes-cours" && (
          <div>
            {enrollments.filter((e) => e.statut === "EN_ATTENTE").length > 0 && (
              <div
                style={{
                  background: COLORS.orange.light,
                  border: `2px solid ${COLORS.orange.DEFAULT}`,
                  padding: "2rem",
                  borderRadius: "10px",
                  marginBottom: "2rem",
                }}
              >
                <h2 style={{ margin: "0 0 1.25rem", color: COLORS.orange.text }}>
                  ⏳ Demandes en attente de validation
                </h2>
                {enrollments
                  .filter((e) => e.statut === "EN_ATTENTE")
                  .map((e) => (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0",
                        borderBottom: `1px solid ${COLORS.orange.DEFAULT}`,
                      }}
                    >
                      <div>
                        <strong>{e.course.title}</strong>
                        <span
                          style={{
                            marginLeft: "1rem",
                            fontSize: "1.25rem",
                            color: COLORS.orange.text,
                          }}
                        >
                          ({e.typePaiement === "PARCOURS_COMPLET"
                            ? "Parcours complet"
                            : "Cours seul"}
                          )
                        </span>
                      </div>
                      <button
                        onClick={() => handleUnenroll(e.course.id)}
                        style={{
                          background: "none",
                          border: `1px solid ${COLORS.orange.DEFAULT}`,
                          color: COLORS.orange.text,
                          padding: "0.3rem 0.7rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {enrollments.filter((e) => e.statut === "PAYE" || e.statut === "GRATUIT")
              .length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>
                <p style={{ fontSize: "1.2rem" }}>Vous n'avez aucun cours actif.</p>
                <button onClick={() => setTab("catalogue")} style={btnPrimary}>
                  🔍 Parcourir le catalogue
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {enrollments
                  .filter((e) => e.statut === "PAYE" || e.statut === "GRATUIT")
                  .map((e) => (
                    <div
                      key={e.id}
                      style={{
                        background: "#f7fafc",
                        padding: "1.25rem",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "1.1rem" }}>
                            {e.course.title}
                          </strong>
                          <div
                            style={{
                              fontSize: "1rem",
                              color: "#718096",
                              marginTop: "1rem",
                            }}
                          >
                            {[e.course.matiere, e.course.niveau, e.course.annee]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                          {e.course.teacher && (
                            <div style={{ fontSize: "1rem", color: "#718096" }}>
                              👨‍🏫 {e.course.teacher.prenom} {e.course.teacher.nom}
                            </div>
                          )}
                          <span
                            style={{
                              background:
                                e.statut === "GRATUIT" ? "#0ea5e9" : COLORS.green.DEFAULT,
                              color: "white",
                              padding: "0.1rem 0.5rem",
                              borderRadius: "10px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {e.statut === "GRATUIT" ? "Gratuit" : "Payé"}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            router.push(`/dashboard/student/courses/${e.course.id}`)
                          }
                          style={btnPrimary}
                        >
                          {e.progression > 0 ? "📖 Continuer" : "📖 Commencer"}
                        </button>
                      </div>
                      <div style={{ marginTop: "2rem" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.85rem",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <span>Progression</span>
                          <span style={{ fontWeight: "bold" }}>{e.progression}%</span>
                        </div>
                        <div
                          style={{
                            background: "#e2e8f0",
                            borderRadius: "10px",
                            height: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              background:
                                e.progression === 100
                                  ? COLORS.green.DEFAULT
                                  : e.progression > 50
                                  ? COLORS.blue.DEFAULT
                                  : COLORS.orange.DEFAULT,
                              width: `${e.progression}%`,
                              height: "100%",
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                        {e.completed && (
                          <p
                            style={{
                              color: "#10B981",
                              fontSize: "0.85rem",
                              marginTop: "0.25rem",
                            }}
                          >
                            ✅ Cours complété !
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
        
{/* ── Tab : Catalogue (AMÉLIORÉ) ── */}
{/* ── Tab : Catalogue (AMÉLIORÉ) ── */}
{tab === "catalogue" && (
  <div>
    {/* Filtres */}
    <div
      style={{
        background: COLORS.green.light,
        padding: "1.5rem",
        borderRadius: "15px",
        marginBottom: "2rem",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <h3
        style={{
          margin: "0 0 1.25rem",
          color: COLORS.text.primary,
          fontSize: "1.1rem",
        }}
      >
        🔍 Filtrer les cours
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        <div>
          <label style={labelStyle}>🎓 Niveau</label>
          <select
            value={filtreNiveau}
            onChange={(e) => {
              setFiltreNiveau(e.target.value);
              setFiltreAnnee("");
            }}
            style={inputStyle}
          >
            <option value="">Tous les niveaux</option>
            <option value="college">Collège</option>
            <option value="lycee">Lycée</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>📅 Classe</label>
          <select
            value={filtreAnnee}
            onChange={(e) => setFiltreAnnee(e.target.value)}
            style={inputStyle}
          >
            <option value="">Toutes les classes</option>
            {filtreNiveau === "college" &&
              ANNEES_COLLEGE.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            {filtreNiveau === "lycee" &&
              ANNEES_LYCEE.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            {!filtreNiveau &&
              [...ANNEES_COLLEGE, ...ANNEES_LYCEE].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>📖 Matière</label>
          <select
            value={filtreMatiere}
            onChange={(e) => setFiltreMatiere(e.target.value)}
            style={inputStyle}
          >
            <option value="">Toutes les matières</option>
            {[
              "Mathématiques",
              "Physique",
              "SVT",
              "Informatique & Programmation",
              "Philosophie",
              "Histoire & Géographie",
              "Arabe",
              "Education islamique",
              "Français",
              "Anglais",
              "Espagnol",
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginTop: "1rem",
        }}
      >
        <button
          onClick={handleCatalogueSearch}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: COLORS.green.gradient,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(5, 150, 105, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 14px rgba(5, 150, 105, 0.3)";
          }}
        >
          🔍 Rechercher
        </button>
        <button
          onClick={handleCatalogueReset}
          style={{
            padding: "0.75rem 1.5rem",
            background: COLORS.orange.light,
            color: COLORS.orange.text,
            border: `1px solid ${COLORS.orange.DEFAULT}`,
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "background 0.2s",
          }}
        >
          ✕ Réinitialiser
        </button>
      </div>
    </div>

    {catalogueLoading ? (
      <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
        ⏳ Chargement des cours...
      </div>
    ) : catalogue.length === 0 ? (
      <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
        <p>Aucun cours disponible pour ces critères.</p>
        <button
          onClick={handleCatalogueReset}
          style={{
            marginTop: "1rem",
            padding: "0.6rem 1.5rem",
            background: COLORS.green.gradient,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Réinitialiser les filtres
        </button>
      </div>
    ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {catalogue.map((c) => {
          // ✅ Récupérer le statut d'inscription
          const enrollment = c.enrollments?.[0];
          const isEnrolled = enrollment?.statut === "PAYE" || enrollment?.statut === "GRATUIT";
          const isPending = enrollment?.statut === "EN_ATTENTE";
          const isRejected = enrollment?.statut === "REJETE";

          return (
            <div
              key={c.id}
              style={{
                background: "white",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                border: isEnrolled 
                  ? "2px solid #059669" 
                  : isPending 
                    ? "2px solid #f59e0b" 
                    : "1px solid #e2e8f0",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
              }}
            >
              {/* Cover */}
              <div
                style={{
                  height: "100px",
                  background: isEnrolled 
                    ? "linear-gradient(135deg, #059669, #10b981)" 
                    : isPending 
                      ? "linear-gradient(135deg, #f59e0b, #d97706)" 
                      : "linear-gradient(135deg, #6b7280, #9ca3af)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3rem",
                  position: "relative",
                }}
              >
                {c.coverImage ? (
                  <img
                    src={c.coverImage}
                    alt={c.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "📚"
                )}
                {isEnrolled && (
                  <span
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      background: "#059669",
                      color: "white",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontSize: "0.7rem",
                      fontWeight: "700",
                    }}
                  >
                    ✅ Inscrit
                  </span>
                )}
                {isPending && (
                  <span
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      background: "#f59e0b",
                      color: "white",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontSize: "0.7rem",
                      fontWeight: "700",
                    }}
                  >
                    ⏳ En attente
                  </span>
                )}
              </div>

              <div style={{ padding: "1rem" }}>
                <h3
                  style={{
                    margin: "0 0 0.5rem",
                    fontWeight: "700",
                    color: "#1f2937",
                    fontSize: "1rem",
                  }}
                >
                  {c.title}
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "0.4rem",
                    flexWrap: "wrap",
                    marginBottom: "0.5rem",
                  }}
                >
                  {c.niveau && (
                    <span
                      style={{
                        background: "#f0fdf4",
                        color: "#166534",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                      }}
                    >
                      {c.niveau === "college"
                        ? "Collège"
                        : c.niveau === "lycee"
                        ? "Lycée"
                        : c.niveau}
                    </span>
                  )}
                  {c.annee && (
                    <span
                      style={{
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                      }}
                    >
                      {c.annee}
                    </span>
                  )}
                  {c.matiere && (
                    <span
                      style={{
                        background: "#fff7ed",
                        color: "#c2410c",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                      }}
                    >
                      {c.matiere}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: "0 0 0.75rem",
                    color: "#64748b",
                    fontSize: "0.8rem",
                  }}
                >
                  📚 {c.chapters?.length || 0} chapitre
                  {c.chapters?.length !== 1 ? "s" : ""}
                  {c.teacher && (
                    <>
                      {" "}
                      • 👨‍🏫 {c.teacher.prenom} {c.teacher.nom}
                    </>
                  )}
                </p>

                {/* ✅ SECTION BOUTONS CONDITIONNELLE */}
                <div style={{ minWidth: "180px" }}>
                  {/* CAS 1 : Déjà inscrit */}
                  {isEnrolled && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          background: "#ecfdf5",
                          border: "2px solid #059669",
                          borderRadius: "8px",
                          padding: "0.5rem",
                          textAlign: "center",
                          color: "#059669",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                        }}
                      >
                        ✅ Déjà inscrit
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/student/courses/${c.id}`)
                        }
                        style={{
                          width: "100%",
                          padding: "0.6rem",
                          background: COLORS.green.gradient,
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "700",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 4px 14px rgba(5, 150, 105, 0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 2px 8px rgba(5, 150, 105, 0.25)";
                        }}
                      >
                        📖 Accéder au cours
                      </button>
                    </div>
                  )}

                  {/* CAS 2 : En attente */}
                  {isPending && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          background: "#fffbeb",
                          border: "2px solid #f59e0b",
                          borderRadius: "8px",
                          padding: "0.5rem",
                          textAlign: "center",
                          color: "#92400e",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                        }}
                      >
                        ⏳ Demande en attente
                      </div>
                      <button
                        onClick={() => handleUnenroll(c.id)}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          background: "none",
                          border: "1px solid #ef4444",
                          color: "#ef4444",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.8rem",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "#fef2f2";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "transparent";
                        }}
                      >
                        Annuler la demande
                      </button>
                    </div>
                  )}

                  {/* CAS 3 : Rejeté */}
                  {isRejected && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "2px solid #ef4444",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        textAlign: "center",
                        color: "#dc2626",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                      }}
                    >
                      ❌ Demande rejetée
                    </div>
                  )}

                  {/* CAS 4 : Pas d'inscription */}
                  {!enrollment && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <select
                        value={typePaiements[c.id] || "COURS_SEUL"}
                        onChange={(e) =>
                          setTypePaiements({
                            ...typePaiements,
                            [c.id]: e.target.value,
                          })
                        }
                        style={{
                          padding: "0.4rem",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e0",
                          fontSize: "0.85rem",
                          width: "100%",
                        }}
                      >
                        <option value="COURS_SEUL">💳 Ce cours uniquement</option>
                        <option value="PARCOURS_COMPLET">🎓 Parcours complet</option>
                      </select>
                      <button
                        onClick={() =>
                          handleEnroll(c.id, typePaiements[c.id] || "COURS_SEUL")
                        }
                        style={{
                          width: "100%",
                          padding: "0.6rem",
                          background: COLORS.green.gradient,
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "700",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 4px 14px rgba(5, 150, 105, 0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 2px 8px rgba(5, 150, 105, 0.25)";
                        }}
                      >
                        ➕ Demander l'accès
                      </button>
                    </div>
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
            <div
              style={{
                background: "#f7fafc",
                padding: "1.25rem",
                borderRadius: "10px",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ margin: "0 0 1rem" }}>✉️ Contacter un enseignant</h3>
              {teachers.length === 0 ? (
                <p style={{ color: "#718096" }}>
                  Inscrivez-vous à un cours pour contacter son enseignant.
                </p>
              ) : (
                <>
                  <select
                    value={newMsg.receiverId}
                    onChange={(e) =>
                      setNewMsg({ ...newMsg, receiverId: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">Choisir un enseignant...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.prenom} {t.nom}
                      </option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Votre message..."
                    value={newMsg.content}
                    onChange={(e) =>
                      setNewMsg({ ...newMsg, content: e.target.value })
                    }
                    style={{
                      ...inputStyle,
                      height: "80px",
                      resize: "vertical",
                      marginTop: "0.75rem",
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMsg}
                    style={{
                      ...btnPrimary,
                      marginTop: "0.75rem",
                      opacity: sendingMsg ? 0.7 : 1,
                    }}
                  >
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
                <div
                  key={otherId}
                  style={{
                    background: "#f7fafc",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background: "#edf2f7",
                      padding: "0.75rem 1rem",
                      fontWeight: "bold",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {conv.user?.prenom} {conv.user?.nom}
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#718096",
                          marginLeft: "0.5rem",
                        }}
                      >
                        ({conv.user?.role})
                      </span>
                    </span>
                    {conv.messages.filter((m) => m.receiverId === user?.id && !m.lu)
                      .length > 0 && (
                      <span
                        style={{
                          background: "#e53e3e",
                          color: "white",
                          padding: "0.1rem 0.5rem",
                          borderRadius: "10px",
                          fontSize: "0.8rem",
                        }}
                      >
                        {
                          conv.messages.filter((m) => m.receiverId === user?.id && !m.lu)
                            .length
                        }{" "}
                        non lu
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "1rem", maxHeight: "250px", overflowY: "auto" }}>
                    {conv.messages
                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                      .map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            justifyContent:
                              m.senderId === user?.id ? "flex-end" : "flex-start",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              background:
                                m.senderId === user?.id
                                  ? COLORS.blue.DEFAULT
                                  : "#e2e8f0",
                              color: m.senderId === user?.id ? "white" : "#1e293b",
                              padding: "0.5rem 0.8rem",
                              borderRadius: "12px",
                              maxWidth: "70%",
                              fontSize: "0.9rem",
                            }}
                          >
                            {m.content}
                            <div
                              style={{
                                fontSize: "0.7rem",
                                opacity: 0.7,
                                marginTop: "0.2rem",
                              }}
                            >
                              {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                              {m.receiverId === user?.id && !m.lu && (
                                <button
                                  onClick={() => handleMarkRead(m.id)}
                                  style={{
                                    marginLeft: "0.5rem",
                                    background: "none",
                                    border: "none",
                                    color: "inherit",
                                    cursor: "pointer",
                                    fontSize: "0.7rem",
                                  }}
                                >
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