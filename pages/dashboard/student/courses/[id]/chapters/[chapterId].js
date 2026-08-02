import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SupportsList from "@/components/SupportsList";

export default function StudentChapterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { id: courseId, chapterId } = router.query;

  const [chapter, setChapter] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("contenu");

  useEffect(() => {
    if (!courseId || !chapterId) return;
    fetchData();
  }, [courseId, chapterId]);

  const fetchData = async () => {
    try {
      // Récupérer le cours
      const courseRes = await fetch(`/api/courses/${courseId}`, {
        credentials: "include",
      });
      const courseData = await courseRes.json();
      setCourse(courseData);

      // Récupérer le chapitre
      const chapterRes = await fetch(`/api/chapters/${chapterId}`, {
        credentials: "include",
      });
      const chapterData = await chapterRes.json();
      setChapter(chapterData);
    } catch (err) {
      console.error("Erreur:", err);
      setError("خطأ أثناء تحميل الفصل");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <div dir="rtl" lang="ar" style={{ padding: "2rem", textAlign: "center" }}>⏳ جارٍ التحميل...</div>
      </ProtectedRoute>
    );
  }

  if (error || !chapter) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <div dir="rtl" lang="ar" style={{ padding: "2rem", color: "#e53e3e" }}>❌ {error}</div>
      </ProtectedRoute>
    );
  }

  const DASHBOARD_TABS = [
    { key: "overview", label: "دروسي", icon: "📚" },
    { key: "messages", label: "الرسائل", icon: "✉️" },
  ];

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <DashboardLayout
        user={user}
        roleIcon="👨‍🎓"
        customTitle={`${course?.title} — ${chapter.title}`}
        tabs={DASHBOARD_TABS}
        activeTab="overview"
        onTabChange={() => router.push("/dashboard/student")}
      >
        <div dir="rtl" lang="ar" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "20px",
              marginBottom: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              border: "1px solid #edf2f7",
            }}
          >
            <button
              onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
              style={{
                background: "none",
                border: "none",
                color: "#f97316",
                cursor: "pointer",
                marginBottom: "1rem",
                fontSize: "0.95rem",
                fontWeight: "600",
              }}
            >
              → {course?.title}
            </button>

            <h1
              style={{
                margin: "0 0 0.5rem",
                fontSize: "2.5rem",
                fontWeight: "800",
                background: "linear-gradient(135deg, #059669, #10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {chapter.title}
            </h1>

            {chapter.objectifs && (
              <p style={{ color: "#718096", fontSize: "1rem", margin: "1rem 0 0" }}>
                📌 {chapter.objectifs}
              </p>
            )}
          </div>

          {/* Onglets */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1.5rem",
              borderBottom: "2px solid #edf2f7",
            }}
          >
            {[
              { key: "contenu", label: "📚 المحتوى", icon: null },
              {
                key: "quiz",
                label: `🧪 اختبار تكويني (${chapter.quiz?.questions?.length || 0})`,
              },
              { key: "devoirs", label: `📝 الواجبات (${chapter.devoirs?.length || 0})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "1rem 1.5rem",
                  border: "none",
                  background: "transparent",
                  fontSize: "1rem",
                  fontWeight: tab === t.key ? "700" : "500",
                  color: tab === t.key ? "#059669" : "#718096",
                  borderBottom: tab === t.key ? "4px solid #059669" : "4px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginBottom: "-2px",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenu */}
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
              border: "1px solid #edf2f7",
              minHeight: "500px",
            }}
          >
            {/* Tab: Contenu */}
            {tab === "contenu" && (
              <div>
                <SupportsList chapterId={chapterId} />
              </div>
            )}

            {/* Tab: Quiz Formatif */}
            {tab === "quiz" && (
              <div>
                {chapter.quiz?.questions?.length > 0 ? (
                  <div>
                    <h3 style={{ marginBottom: "1rem", color: "#059669" }}>
                      🧪 اختبار تكويني — {chapter.quiz.questions.length} سؤال
                    </h3>
                    <p style={{ color: "#718096", marginBottom: "1.5rem" }}>
                      يتيح لك هذا الاختبار قياس فهمك. يمكنك إعادته بقدر ما تشاء.
                    </p>

                    <div style={{ display: "grid", gap: "1.5rem" }}>
                      {chapter.quiz.questions.map((q, i) => (
                        <div
                          key={q.id}
                          style={{
                            background: "#f8fafc",
                            padding: "1.5rem",
                            borderRadius: "12px",
                            border: "1px solid #edf2f7",
                          }}
                        >
                          <div style={{ marginBottom: "1rem" }}>
                            <span
                              style={{
                                background: "#3182ce",
                                color: "white",
                                padding: "0.2rem 0.6rem",
                                borderRadius: "20px",
                                fontSize: "0.75rem",
                                marginLeft: "0.5rem",
                              }}
                            >
                              س{i + 1}
                            </span>
                            <strong style={{ fontSize: "1.05rem" }}>{q.texte}</strong>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {q.choix.map((choice, j) => (
                              <label
                                key={j}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  padding: "0.75rem",
                                  background: "white",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`q-${q.id}`}
                                  value={choice}
                                  style={{ cursor: "pointer" }}
                                />
                                {choice}
                              </label>
                            ))}
                          </div>

                          <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#718096" }}>
                            النقاط: {q.points}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      style={{
                        marginTop: "2rem",
                        padding: "0.75rem 1.5rem",
                        background: "linear-gradient(135deg, #059669, #10b981)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "1rem",
                      }}
                    >
                      ✅ تأكيد إجاباتي
                    </button>
                  </div>
                ) : (
                  <p style={{ color: "#718096", textAlign: "center", padding: "2rem" }}>
                    لا يوجد اختبار تكويني لهذا الفصل
                  </p>
                )}
              </div>
            )}

            {/* Tab: Devoirs */}
            {tab === "devoirs" && (
              <div>
                {chapter.devoirs?.length > 0 ? (
                  <div>
                    <h3 style={{ marginBottom: "1rem", color: "#059669" }}>
                      📝 الواجبات — {chapter.devoirs.length} واجب
                    </h3>

                    <div style={{ display: "grid", gap: "1.5rem" }}>
                      {chapter.devoirs.map((devoir) => {
                        const dateLimit = new Date(devoir.dateLimit);
                        const now = new Date();
                        const isLate = now > dateLimit;

                        return (
                          <div
                            key={devoir.id}
                            style={{
                              background: isLate ? "#fff5f5" : "#f0fff4",
                              padding: "1.5rem",
                              borderRadius: "12px",
                              border: `1px solid ${isLate ? "#fed7d7" : "#c6f6d5"}`,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                              <div>
                                <h4 style={{ margin: "0 0 0.5rem", color: "#2d3748" }}>
                                  {devoir.titre}
                                </h4>
                                <div
                                  style={{
                                    color: "#718096",
                                    fontSize: "0.9rem",
                                    lineHeight: "1.6",
                                    marginBottom: "1rem",
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: devoir.consigne,
                                  }}
                                />
                              </div>
                              <div style={{ textAlign: "left", minWidth: "150px" }}>
                                <div
                                  style={{
                                    background: isLate ? "#ef4444" : "#059669",
                                    color: "white",
                                    padding: "0.5rem 1rem",
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                  }}
                                >
                                  {isLate ? "⏰ متأخر" : "📅 للتسليم"}
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#718096", marginTop: "0.5rem" }}>
                                  {dateLimit.toLocaleDateString("ar-DZ")}
                                </div>
                              </div>
                            </div>

                            <button
                              style={{
                                padding: "0.6rem 1.25rem",
                                background: "#3182ce",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                              }}
                            >
                              📤 تسليم واجب
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "#718096", textAlign: "center", padding: "2rem" }}>
                    لا يوجد أي واجب لهذا الفصل
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
