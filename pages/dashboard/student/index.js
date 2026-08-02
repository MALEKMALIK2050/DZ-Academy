import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chat from "@/components/Chat";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import ProfileDropdown from "@/components/ProfileDropdown";
import { MATIERES, NIVEAUX, ANNEES_COLLEGE, ANNEES_LYCEE, getMatiereLabel, getNiveauLabel, getMatiereStyles, getSubjectIcon, getSubjectDecorations } from "@/lib/constants";

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

import CataloguePaymentModal from "@/components/student/CataloguePaymentModal";

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
  const [paymentModalParams, setPaymentModalParams] = useState(null);

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

      const res = await fetch(`/api/courses/public?${params.toString()}`, {
        credentials: "include",
      });
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

  const handleEnroll = async (courseId, typePaiement, preuveFile) => {
    setError("");
    setSuccess("");
    try {
      const body = { courseId, typePaiement };
      const res = await fetch("/api/student/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        if (preuveFile && data.id) {
          const formData = new FormData();
          formData.append("preuve", preuveFile);
          formData.append("enrollmentId", data.id);
          await fetch("/api/student/upload-preuve", {
            method: "POST",
            credentials: "include",
            body: formData,
          });
        }
        await fetch("/api/notifications/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ courseId, type: "DEMANDE_INSCRIPTION" }),
        });
        setSuccess("✅ تم إرسال الطلب! سيقوم المسؤول بالتحقق من تسجيلك.");
        setPaymentModalParams(null);
        fetchAll("", "");
        fetchCatalogueCourses(filtreNiveau, filtreAnnee, filtreMatiere);
      } else {
        setError(data.error || "خطأ في التسجيل");
      }
    } catch {
      setError("خطأ في الخادم");
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!confirm("هل تريد إلغاء طلب التسجيل؟")) return;
    try {
      await fetch("/api/student/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId }),
      });
      fetchAll("", "");
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

  if (authLoading || loading) return <p>جارٍ التحميل...</p>;

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
    { key: "overview", label: "فضاء التلميذ", icon: "🎓" },
    {
      key: "mes-cours",
      label: "دروسي",
      icon: "📖",
      badge: enrollments.filter((e) => e.statut === "PAYE" || e.statut === "GRATUIT")
        .length,
    },
    { key: "messages", label: "الرسائل", icon: "✉️", badge: nonLus },
    { key: "chat", label: "الدردشة", icon: "💬", badge: totalUnreadChat },
    { key: "catalogue", label: "ابحث عن المزيد من الدروس!", icon: "🔍", isFooter: true },
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
    padding: "0.75rem 1.75rem",
    border: "none",
    borderRadius: "9999px",
    cursor: "pointer",
    fontWeight: "700",
    boxShadow: "0 6px 20px rgba(30,64,175,0.35)",
  };

  const btnSuccess = {
    background: COLORS.green.gradient,
    color: "white",
    padding: "0.75rem 1.75rem",
    border: "none",
    borderRadius: "9999px",
    cursor: "pointer",
    fontWeight: "700",
    boxShadow: "0 6px 20px rgba(16,185,129,0.35)",
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎓"
        customTitle="فضاء التلميذ"
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
              👨‍🎓 مرحباً{" "}
              <span style={{ color: COLORS.green.DEFAULT }}>{user?.prenom}</span>!
            </h1>
            <p style={{ color: COLORS.text.secondary }}>
              استكشف دروسك وطوّر مستواك
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
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>دروسي النشطة</div>
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
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>قيد الانتظار</div>
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
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>الدروس المكتملة</div>
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
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>رسائل غير مقروءة</div>
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
                  ⏳ طلبات في انتظار المصادقة
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
                            ? "المسار الكامل"
                            : "الدرس فقط"}
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
                        إلغاء
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {enrollments.filter((e) => e.statut === "PAYE" || e.statut === "GRATUIT")
              .length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>
                <p style={{ fontSize: "1.2rem" }}>ليس لديك أي دروس نشطة حالياً.</p>
                <button onClick={() => setTab("catalogue")} className="btn-dent-blue" style={btnPrimary}>
                  🔍 تصفّح الفهرس
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
                          <strong style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1a202c", letterSpacing: "-0.5px" }}>
                            {e.course?.title}
                          </strong>
                          <div
                            style={{
                              fontSize: "1rem",
                              color: "#718096",
                              marginTop: "1rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              flexWrap: "wrap"
                            }}
                          >
                            <span style={getMatiereStyles(e.course?.matiere)}>
                              {getMatiereLabel(e.course?.matiere)}
                            </span>
                            {e.course?.niveau || e.course?.annee ? " • " : ""}
                            {[e.course?.niveau, e.course?.annee].filter(Boolean).join(" • ")}
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
                            {e.statut === "GRATUIT" ? "مجاني" : "مدفوع"}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            router.push(`/dashboard/student/courses/${e.course.id}`)
                          }
                          className="btn-dent-blue"
                          style={btnPrimary}
                        >
                          {e.progression > 0 ? "📖 المتابعة" : "📖 البداية"}
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
                          <span>التقدم</span>
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
                            ✅ تم إكمال الدرس!
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
        {tab === "catalogue" && (
          <div>
            {/* Filtres */}
            <div
              style={{
                backgroundColor: "#f7f3ec",
                backgroundImage: "url('/images/bg-algerian.png')",
                backgroundSize: "250px",
                backgroundRepeat: "repeat",
                padding: "2rem",
                borderRadius: "20px",
                marginBottom: "3rem",
                border: "2px solid #ea580c",
                boxShadow: "8px 8px 0px rgba(234, 88, 12, 0.8)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1.25rem",
                  color: COLORS.text.primary,
                  fontSize: "1.1rem",
                }}
              >
                🔍 تصفية الدروس
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <select
                  value={filtreNiveau}
                  onChange={(e) => {
                    const niv = e.target.value;
                    setFiltreNiveau(niv);
                    setFiltreAnnee(""); 
                    setFiltreMatiere(""); 
                    fetchCatalogueCourses(niv, "", "");
                  }}
                  style={{
                    padding: "0.6rem 1rem", borderRadius: "10px", border: "2px solid #e2e8f0", outline: "none", fontWeight: "600", color: "#4a5568", backgroundColor: "white", cursor: "pointer", minWidth: "140px"
                  }}
                >
                  <option value="">🏫 جميع المستويات</option>
                  <option value="college">🏫 المتوسط</option>
                  <option value="lycee">🎓 الثانوي</option>
                </select>

                {filtreNiveau && (
                  <select
                    value={filtreAnnee}
                    onChange={(e) => {
                      const ann = e.target.value;
                      setFiltreAnnee(ann);
                      setFiltreMatiere(""); 
                      fetchCatalogueCourses(filtreNiveau, ann, "");
                    }}
                    style={{
                      padding: "0.6rem 1rem", borderRadius: "10px", border: "2px solid #e2e8f0", outline: "none", fontWeight: "600", color: "#4a5568", backgroundColor: "white", cursor: "pointer", minWidth: "140px"
                    }}
                  >
                    <option value="">📅 جميع السنوات</option>
                    {(filtreNiveau === "college" ? ANNEES_COLLEGE : ANNEES_LYCEE).map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                )}

                {filtreAnnee && (
                  <select
                    value={filtreMatiere}
                    onChange={(e) => {
                      const mat = e.target.value;
                      setFiltreMatiere(mat);
                      fetchCatalogueCourses(filtreNiveau, filtreAnnee, mat);
                    }}
                    style={{
                      padding: "0.6rem 1rem", borderRadius: "10px", border: "2px solid #e2e8f0", outline: "none", fontWeight: "600", color: "#4a5568", backgroundColor: "white", cursor: "pointer", minWidth: "140px"
                    }}
                  >
                    <option value="">📘 جميع المواد</option>
                    {MATIERES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {catalogueLoading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                ⏳ جارٍ تحميل الدروس...
              </div>
            ) : catalogue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                <p>لا توجد دروس متاحة لهذه المعايير.</p>
                <button
                  onClick={handleCatalogueReset}
                  className="btn-dent-green"
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
                  إعادة تعيين الفلاتر
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                {(() => {
                  const renderCourseCard = (c) => {
                    const enrollment = c.enrollments?.[0] || null;
                    const isEnrolled = enrollment?.statut === "PAYE" || enrollment?.statut === "GRATUIT";
                    const isPending = enrollment?.statut === "EN_ATTENTE";
                    const isRejected = enrollment?.statut === "REJETE";
                    
                    const subjectTheme = getMatiereStyles ? getMatiereStyles(c.matiere) : { color: "#4A5568", background: "#F7FAFC15" };
                    const subjectIcon = getSubjectIcon ? getSubjectIcon(c.matiere) : "📘";
                    const subjectDeco = getSubjectDecorations ? getSubjectDecorations(c.matiere) : "📖  📝  ✏️";
                    
                    // Extract colors for the modern UI
                    const primaryColor = subjectTheme.color || "#4A5568";
                    const bgColor = `${primaryColor}12`;

                    return (
                      <div key={c.id} style={{ 
                        display: "flex", flexDirection: "column",
                        background: "white", 
                        border: "2px solid " + primaryColor + "20", 
                        borderRadius: "20px", 
                        boxShadow: "0 10px 25px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02)", 
                        overflow: "hidden",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        cursor: "pointer",
                        minWidth: "320px",
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 15px 35px " + primaryColor + "18";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02)";
                      }}
                      >
                        {/* Banner part */}
                        <div style={{
                          height: "120px",
                          background: "#f8fafc",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "1rem 1.5rem",
                          position: "relative",
                          borderBottom: "1px solid #f1f5f9"
                        }}>
                          <div style={{ fontSize: "2.8rem", marginBottom: "0.25rem" }}>{subjectIcon}</div>
                          <div style={{ fontSize: "0.7rem", color: primaryColor, opacity: 0.6, letterSpacing: "3px", fontWeight: "600" }}>{subjectDeco}</div>
                          <div style={{
                            position: "absolute", top: "0.5rem", right: "0.5rem",
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            padding: "0.25rem 0.7rem",
                            borderRadius: "12px",
                            fontWeight: "700",
                            fontSize: "0.7rem",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase"
                          }}>
                            {c.niveau === "college" ? "المتوسط" : c.niveau === "lycee" ? "الثانوي" : c.niveau} {c.annee ? ("• " + c.annee) : ""}
                          </div>
                        </div>

                        {/* Content part */}
                        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                          <h3 style={{ fontWeight: "800", color: "#1e293b", fontSize: "1.15rem", margin: "0 0 0.5rem", lineHeight: "1.4" }}>{c.title}</h3>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                            <span style={{
                              padding: "0.2rem 0.6rem",
                              borderRadius: "6px",
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                              fontWeight: "700",
                              fontSize: "0.8rem"
                            }}>{subjectIcon} {MATIERES.find(m => m.value === c.matiere)?.label || c.matiere}</span>
                            <span style={{
                              padding: "0.2rem 0.6rem",
                              borderRadius: "6px",
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                              fontWeight: "700",
                              fontSize: "0.8rem"
                            }}>📖 {c.chapters?.length || 0} ch.</span>
                          </div>
                          
                          <div style={{ marginTop: "auto" }}>
                            {c.isFreeTrial && (
                              <p style={{
                                fontSize: "1rem",
                                fontWeight: "800",
                                color: "#10b981",
                                marginBottom: "0.75rem"
                              }}>
                                🎁 مجاني
                              </p>
                            )}
                            <div style={{ minWidth: "180px" }}>
                              {isEnrolled ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); router.push("/dashboard/student/courses/" + c.id); }}
                                  className="btn-dent-blue"
                                  style={btnPrimary}
                                >
                                  📖 الدخول إلى الدرس
                                </button>
                              ) : isPending ? (
                                <button onClick={(e) => { e.stopPropagation(); handleUnenroll(c.id); }} className="btn-dent-outline" style={{ width: "100%", padding: "0.6rem" }}>إلغاء الطلب</button>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                                  {c.isFreeTrial ? (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); router.push("/dashboard/student/courses/" + c.id); }}
                                      className="btn-dent-green"
                                      style={{ ...btnPrimary, width: "100%" }}
                                    >
                                      🎁 ابدأ مجاناً
                                    </button>
                                  ) : (
                                    <div>
                                      <select
                                        value={typePaiements[c.id] || "COURS_SEUL"}
                                        onChange={(e) => setTypePaiements({ ...typePaiements, [c.id]: e.target.value })}
                                        style={{ padding: "0.5rem 1rem", borderRadius: "9999px", border: "1px solid #cbd5e0", fontSize: "0.9rem", width: "100%", fontWeight: "600", color: "#4a5568", marginBottom: "0.5rem" }}
                                      >
                                        <option value="COURS_SEUL">💳 هذا الدرس فقط</option>
                                        <option value="PARCOURS_COMPLET">🎓 المسار الكامل</option>
                                      </select>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setPaymentModalParams({ course: c, typePaiement: typePaiements[c.id] || "COURS_SEUL" }); }}
                                        className="btn-dent-blue"
                                        style={{ ...btnPrimary, width: "100%" }}
                                      >
                                        ➕ طلب الوصول
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <>
                      {MATIERES.map((matiereDef) => {
                        const coursesInMatiere = catalogue.filter((c) => c.matiere === matiereDef.value).sort((a, b) => {
                          const numA = parseInt((a.title || "").match(/\d+/)?.[0] || 0);
                          const numB = parseInt((b.title || "").match(/\d+/)?.[0] || 0);
                          if (numA !== numB) return numA - numB;
                          return (a.title || "").localeCompare(b.title || "", undefined, { numeric: true, sensitivity: 'base' });
                        });
                        if (coursesInMatiere.length === 0) return null;
                        
                        const subjectTheme = getMatiereStyles ? getMatiereStyles(matiereDef.value) : { color: "#4A5568", background: "#F7FAFC" };
                        const subjectIcon = getSubjectIcon ? getSubjectIcon(matiereDef.value) : "📘";

                        return (
                          <div key={matiereDef.value}>
                            <div style={{
                              display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem",
                              padding: "1rem 1.5rem", borderRadius: "12px", background: subjectTheme.background,
                              borderLeft: `6px solid ${subjectTheme.color}`
                            }}>
                              <span style={{ fontSize: "2rem" }}>{subjectIcon}</span>
                              <h2 style={{ margin: 0, color: subjectTheme.color, fontSize: "1.5rem", fontWeight: "800" }}>
                                {matiereDef.label}
                              </h2>
                            </div>
                            <div style={{ display: "flex", overflowX: "auto", gap: "1.5rem", paddingBottom: "1rem" }}>
                              {coursesInMatiere.map((c) => renderCourseCard(c))}
                            </div>
                          </div>
                        );
                      })}

                      {(() => {
                        const unknownCourses = catalogue.filter((c) => !MATIERES.some((m) => m.value === c.matiere)).sort((a, b) => {
                          const numA = parseInt((a.title || "").match(/\d+/)?.[0] || 0);
                          const numB = parseInt((b.title || "").match(/\d+/)?.[0] || 0);
                          if (numA !== numB) return numA - numB;
                          return (a.title || "").localeCompare(b.title || "", undefined, { numeric: true, sensitivity: 'base' });
                        });
                        if (unknownCourses.length === 0) return null;
                        return (
                          <div key="unknown">
                            <div style={{
                              display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem",
                              padding: "1rem 1.5rem", borderRadius: "12px", background: "#F7FAFC",
                              borderLeft: `6px solid #4A5568`
                            }}>
                              <span style={{ fontSize: "2rem" }}>📘</span>
                              <h2 style={{ margin: 0, color: "#4A5568", fontSize: "1.5rem", fontWeight: "800" }}>
                                مواد أخرى
                              </h2>
                            </div>
                            <div style={{ display: "flex", overflowX: "auto", gap: "1.5rem", paddingBottom: "1rem" }}>
                              {unknownCourses.map((c) => renderCourseCard(c))}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            )}
            <CataloguePaymentModal
              isOpen={!!paymentModalParams}
              onClose={() => setPaymentModalParams(null)}
              course={paymentModalParams?.course}
              typePaiement={paymentModalParams?.typePaiement}
              onConfirm={handleEnroll}
            />
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
              <h3 style={{ margin: "0 0 1rem" }}>✉️ التواصل مع أستاذ</h3>
              {teachers.length === 0 ? (
                <p style={{ color: "#718096" }}>
                  سجّل في درس للتواصل مع أستاذه.
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
                    <option value="">اختر أستاذاً...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.prenom} {t.nom}
                      </option>
                    ))}
                  </select>
                  <textarea
                    placeholder="رسالتك..."
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
                    {sendingMsg ? "جارٍ الإرسال..." : "📤 إرسال"}
                  </button>
                </>
              )}
            </div>

            <h3>💬 المحادثات</h3>
            {Object.keys(conversations).length === 0 ? (
              <p style={{ color: "#718096" }}>لا توجد محادثات.</p>
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
                        رسالة غير مقروءة
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
                              {new Date(m.createdAt).toLocaleDateString("ar-DZ")}
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
                                  ✓ تمت القراءة
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
            <h3>💬 الدردشة</h3>
            <Chat />
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}