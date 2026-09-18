import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileDropdown from "@/components/ProfileDropdown";
import { io } from "socket.io-client";
import Chat from "@/components/Chat";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import VisioTab from "@/components/visio/VisioTab";
import { MATIERES, NIVEAUX, ANNEES_COLLEGE, ANNEES_LYCEE } from "@/lib/constants";

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
      const cData = await cRes.json();
      const sData = await sRes.json();
      const mData = await mRes.json();
      const nData = await nRes.json();
      setCourses(Array.isArray(cData) ? cData : []);
      setStudentStats(Array.isArray(sData?.studentStats) ? sData.studentStats : []);
      setMessages(Array.isArray(mData) ? mData : []);
      setNotifications(Array.isArray(nData) ? nData : []);
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

  if (loading) return <p dir="rtl" lang="ar">جارٍ التحميل...</p>;

  const DASHBOARD_TABS = [
    { key: "overview", label: "فضاء الأستاذ", icon: "👨‍🏫" },
    { key: "courses", label: "دروسي", icon: "📚", badge: courses.length },
    { key: "students", label: "تلاميذي", icon: "👨‍🎓", badge: studentStats.length },
    { key: "visio", label: "الاجتماعات", icon: "📹" },
    { key: "messages", label: "الرسائل", icon: "✉️", badge: messages.filter(m => m.receiverId === user?.id && !m.lu).length },
    { key: "chat", label: "الدردشة", icon: "💬" },
  ];

  return (
    <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
      <DashboardLayout
        user={user}
        roleIcon="👨‍🏫"
        customTitle="فضاء الأستاذ"
        tabs={DASHBOARD_TABS}
        activeTab={tab}
        onTabChange={setTab}
      >
        <div dir="rtl" lang="ar">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "800", color: "#059669" }}>
              👨‍🏫 لوحة تحكم الأستاذ
            </h1>
            <p style={{ color: "#718096" }}>تابع دروسك و تلاميذك</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: "#edf2f7", border: "none", borderRadius: "8px", padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "1.2rem" }}>
                🔔 {notifications.filter(n => !n.lu).length}
              </button>
              {showNotifs && (
                <div style={{ position: "absolute", left: 0, top: "110%", width: "300px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 100 }}>
                  <div style={{ padding: "1rem", maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.length === 0 ? <p style={{ color: "#718096" }}>لا توجد إشعارات</p> : notifications.map(n => (
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
              { label: "📚 الدروس", count: courses.length, color: "#3182ce" },
              { label: "👨‍🎓 التلاميذ", count: studentStats.length, color: "#059669" },
              { label: "💬 الرسائل", count: messages.length, color: "#dd6b20" },
              { label: "🔔 الإشعارات", count: notifications.length, color: "#805ad5" },
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
              <p style={{ color: "#718096" }}>لا يوجد أي درس مُسنَد إليك</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {courses.map((c) => (
                  <div key={c.id} style={{ background: "#f7fafc", padding: "1.25rem", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "1.1rem" }}>{c.title}</strong>
                      <div style={{ fontSize: "0.85rem", color: "#718096", marginTop: "0.25rem" }}>
                        {c.matiere} • {c.niveau} • {c.enrollments?.length || 0} تلميذ
                      </div>
                    </div>
                    <button onClick={() => router.push(`/dashboard/teacher/courses/${c.id}`)} style={{ background: "#059669", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
                      👁 عرض
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
              <p style={{ color: "#718096" }}>لا يوجد أي تلميذ</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {studentStats.map((s) => (
                  <div key={s.student?.id} style={{ background: "#f7fafc", padding: "1.25rem", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{s.student?.prenom} {s.student?.nom}</strong>
                      <div style={{ fontSize: "0.85rem", color: "#718096" }}>{s.student?.email}</div>
                    </div>
                    <button onClick={() => setSelectedStudent(s)} style={{ background: "#059669", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
                      👁 الملف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "messages" && (
          <div>
            <h3>✉️ رسالة جديدة</h3>
            <select value={newMsg.receiverId} onChange={(e) => setNewMsg({ ...newMsg, receiverId: e.target.value })} style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #cbd5e0" }}>
              <option value="">اختر جهة اتصال...</option>
              {studentStats.map((s) => <option key={s.student?.id} value={s.student?.id}>{s.student?.prenom} {s.student?.nom}</option>)}
            </select>
            <textarea placeholder="الرسالة..." value={newMsg.content} onChange={(e) => setNewMsg({ ...newMsg, content: e.target.value })} style={{ width: "100%", padding: "0.75rem", minHeight: "100px", borderRadius: "6px", border: "1px solid #cbd5e0", marginBottom: "1rem" }} />
            <button onClick={handleSendMessage} disabled={sendingMsg} style={{ background: "#059669", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
              {sendingMsg ? "جارٍ الإرسال..." : "📤 إرسال"}
            </button>
          </div>
        )}

        {tab === "chat" && <Chat />}

        {tab === "visio" && (
          <VisioTab user={user} />
        )}
        </div>
      </DashboardLayout>

      {/* ── Modal Fiche Élève ── */}
      {selectedStudent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}
          onClick={() => setSelectedStudent(null)}>
          <div style={{ background: "white", borderRadius: "16px", padding: "2rem", width: "90%", maxWidth: "700px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "800", color: "#059669" }}>
                  📋 بطاقة {selectedStudent.student?.prenom} {selectedStudent.student?.nom}
                </h2>
                <p style={{ margin: "0.25rem 0 0", color: "#718096", fontSize: "0.9rem" }}>
                  {selectedStudent.student?.email} — {selectedStudent.student?.classe || ""} {selectedStudent.student?.niveau || ""}
                </p>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: "#edf2f7", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Stats rapides */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                { label: "دروس مسجّلة", value: selectedStudent.enrollments?.length || 0, color: "#3182ce" },
                { label: "اختبارات", value: selectedStudent.quizCount || 0, color: "#805ad5" },
                { label: "فصول مقروءة", value: selectedStudent.chapitresLus || 0, color: "#38a169" },
                { label: "المعدّل", value: selectedStudent.scoreMoyen ? `${selectedStudent.scoreMoyen}%` : "—", color: "#dd6b20" },
              ].map((stat) => (
                <div key={stat.label} style={{ background: stat.color, color: "white", padding: "0.75rem", borderRadius: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>{stat.value}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Cours inscrits */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem", color: "#2d3748" }}>📚 الدروس المسجّلة</h3>
              {(!selectedStudent.enrollments || selectedStudent.enrollments.length === 0) ? (
                <p style={{ color: "#718096", fontSize: "0.9rem" }}>لا يوجد أي تسجيل</p>
              ) : (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {selectedStudent.enrollments.map((e) => (
                    <div key={e.id} style={{ background: "#f7fafc", padding: "0.75rem 1rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0" }}>
                      <div>
                        <strong style={{ fontSize: "0.95rem" }}>{e.course?.title}</strong>
                        <div style={{ fontSize: "0.8rem", color: "#718096" }}>{e.course?.matiere} • {e.course?.annee}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ background: "#e2e8f0", borderRadius: "10px", height: "8px", width: "60px", overflow: "hidden" }}>
                          <div style={{ background: e.progression > 75 ? "#38a169" : e.progression > 40 ? "#dd6b20" : "#e53e3e", width: `${e.progression || 0}%`, height: "100%" }} />
                        </div>
                        <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>{e.progression || 0}%</span>
                        {e.completed && <span style={{ color: "#38a169" }}>✅</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Résultats Quiz */}
            {(() => {
              // Fetch quiz results for this student from the parent data
              const studentQuizResults = (courses || []).flatMap(c => 
                (c.chapters || []).flatMap(ch => {
                  if (!ch.quiz?.quizResults) return [];
                  return ch.quiz.quizResults
                    .filter(r => r.studentId === selectedStudent.student?.id)
                    .map(r => ({ ...r, chapterTitle: ch.title, courseTitle: c.title, quizType: ch.quiz.type }));
                })
              );

              const studentFormatifs = studentQuizResults.filter(r => r.quizType === "FORMATIF");
              const studentSommatifs = studentQuizResults.filter(r => r.quizType === "SOMMATIF");

              return (
                <>
                  {/* Quiz Formatifs */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem", color: "#2d3748" }}>📝 اختبارات تكوينية ({studentFormatifs.length})</h3>
                    {studentFormatifs.length === 0 ? (
                      <p style={{ color: "#718096", fontSize: "0.9rem" }}>لا توجد نتائج</p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ background: "#f0fff4" }}>
                            <th style={{ padding: "0.5rem", textAlign: "right" }}>الدرس</th>
                            <th style={{ padding: "0.5rem", textAlign: "right" }}>الفصل</th>
                            <th style={{ padding: "0.5rem", textAlign: "center" }}>النتيجة</th>
                            <th style={{ padding: "0.5rem", textAlign: "right" }}>التاريخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentFormatifs.map((r) => (
                            <tr key={r.id} style={{ borderBottom: "1px solid #edf2f7" }}>
                              <td style={{ padding: "0.5rem" }}>{r.courseTitle}</td>
                              <td style={{ padding: "0.5rem" }}>{r.chapterTitle}</td>
                              <td style={{ padding: "0.5rem", textAlign: "center" }}>
                                <span style={{ background: r.score >= 70 ? "#c6f6d5" : r.score >= 50 ? "#fefcbf" : "#fed7d7", padding: "0.15rem 0.5rem", borderRadius: "20px", fontWeight: "600" }}>
                                  {r.score}%
                                </span>
                              </td>
                              <td style={{ padding: "0.5rem", color: "#718096" }}>{new Date(r.createdAt).toLocaleDateString("ar-DZ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Quiz Sommatifs */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem", color: "#2d3748" }}>📊 اختبارات تحصيلية ({studentSommatifs.length})</h3>
                    {studentSommatifs.length === 0 ? (
                      <p style={{ color: "#718096", fontSize: "0.9rem" }}>لا توجد نتائج</p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ background: "#fff5f5" }}>
                            <th style={{ padding: "0.5rem", textAlign: "right" }}>الدرس</th>
                            <th style={{ padding: "0.5rem", textAlign: "center" }}>النتيجة</th>
                            <th style={{ padding: "0.5rem", textAlign: "center" }}>المحاولات</th>
                            <th style={{ padding: "0.5rem", textAlign: "right" }}>التاريخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentSommatifs.map((r) => (
                            <tr key={r.id} style={{ borderBottom: "1px solid #edf2f7" }}>
                              <td style={{ padding: "0.5rem" }}>{r.courseTitle}</td>
                              <td style={{ padding: "0.5rem", textAlign: "center" }}>
                                <span style={{ background: r.score >= 70 ? "#c6f6d5" : r.score >= 50 ? "#fefcbf" : "#fed7d7", padding: "0.15rem 0.5rem", borderRadius: "20px", fontWeight: "600" }}>
                                  {r.score}%
                                </span>
                              </td>
                              <td style={{ padding: "0.5rem", textAlign: "center" }}>{r.tentatives || 1}</td>
                              <td style={{ padding: "0.5rem", color: "#718096" }}>{new Date(r.createdAt).toLocaleDateString("ar-DZ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Bouton envoyer message */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => {
                  setNewMsg({ receiverId: selectedStudent.student?.id, content: "" });
                  setSelectedStudent(null);
                  setTab("messages");
                }}
                style={{ background: "#3182ce", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}
              >
                ✉️ إرسال رسالة
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{ background: "#edf2f7", color: "#4a5568", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}