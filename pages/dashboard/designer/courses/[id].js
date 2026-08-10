import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

const RichEditor = dynamic(() => import("@/components/RichEditor"), { ssr: false });

const QUESTION_TYPES = [
  { value: "QCM", label: "QCM — إجابة واحدة صحيحة" },
  { value: "QCM_MULTIPLE", label: "QCM متعدد الخيارات" },
  { value: "VRAI_FAUX", label: "صحيح / خطأ" },
  { value: "OUVERTE", label: "سؤال مفتوح" },
  { value: "GAP", label: "نص بفرغات" },
  { value: "MATCHING", label: "ربط" },
  { value: "ORDERING", label: "ترتيب" },
];

const emptyPretestQ = {
  texte: "", choix: ["", "", "", ""], reponse: "", points: 1,
  texteTrous: "", paires: [{ gauche: "", droite: "" }, { gauche: "", droite: "" }],
  elements: ["", "", "", ""], reponsesMultiples: [],
};

export default function ManageCourse() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [showImportModal, setShowImportModal] = useState(false);

  // ✅ CORRECTION : ajout de 'id' dans les dépendances
useEffect(() => {
  if (!id) return; // ✅ CORRECTION
  if (router.query.import === 'true') {
    setShowImportModal(true);
  }
}, [router.query.import, id]); 

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("info");

  // Pretest state
  const [pretestQuestions, setPretestQuestions] = useState([]);
  const [addingPretestQ, setAddingPretestQ] = useState(false);
  const [pretestQType, setPretestQType] = useState("QCM");
  const [newPretestQ, setNewPretestQ] = useState(emptyPretestQ);
  const [pretestError, setPretestError] = useState("");
  const [pretestSuccess, setPretestSuccess] = useState("");

  // Formulaire nouveau chapitre
  const [newChapter, setNewChapter] = useState({ title: "", objectifs: "", position: null });
  const [addingChapter, setAddingChapter] = useState(false);

  // ====================================================
  // 🎓 NOUVEAU : ÉTATS SCORM
  // ====================================================
  const [scormPackages, setScormPackages] = useState([]);
  const [scormLoading, setScormLoading] = useState(false);
  const [scormError, setScormError] = useState("");
  const [activeScorm, setActiveScorm] = useState(null);

  // Upload States
  const [uploadingScorm, setUploadingScorm] = useState(false);
  const [scormTitle, setScormTitle] = useState("");
  const [scormFile, setScormFile] = useState(null);
  const [scormUploadError, setScormUploadError] = useState("");

  // ✅ CORRECTION : ajout de 'id' dans les dépendances
useEffect(() => {
  if (!id) return; // ✅ CORRECTION
  fetchCourse();
}, [router.query.refresh, id]); // ✅ CORRECTION

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "خطأ في التحميل");
      setCourse(data);
      setPretestQuestions(data.pretest?.questions || []);
    } catch {
      setError("خطأ في الخادم");
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // 🎓 NOUVEAU : FETCH DES SCORM
  // ====================================================
  const fetchScormPackages = async () => {
    if (!id) return;
    setScormLoading(true);
    setScormError("");
    try {
      const res = await fetch(`/api/scorm/list?courseId=${id}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setScormPackages(Array.isArray(data) ? data : []);
      } else {
        setScormError(data.error || "خطأ في تحميل SCORM");
      }
    } catch (err) {
      setScormError("خطأ في الخادم : " + err.message);
    } finally {
      setScormLoading(false);
    }
  };

  // Charger les SCORM quand on clique sur l'onglet
  useEffect(() => {
    if (tab === "scorm") {
      fetchScormPackages();
    }
  }, [tab, id]);

  // ====================================================
  // 🎓 NOUVEAU : SUPPRESSION D'UN SCORM
  // ====================================================
  const handleDeleteScorm = async (scormId) => {
    if (!confirm("هل تريد حذف وحدة SCORM هذه؟")) return;
    try {
      const res = await fetch(`/api/scorm/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scormId }),
      });
      if (res.ok) {
        fetchScormPackages();
      }
    } catch (err) {
      setScormError("خطأ في الحذف : " + err.message);
    }
  };

  const handleUploadScorm = async () => {
    if (!scormTitle || !scormFile) {
      return setScormUploadError("العنوان وملف ZIP إلزاميان.");
    }
    setUploadingScorm(true);
    setScormUploadError("");

    const formData = new FormData();
    formData.append("courseId", id);
    formData.append("title", scormTitle);
    formData.append("scormFile", scormFile);

    try {
      const res = await fetch("/api/scorm/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = "خطأ في الرفع";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          // La réponse n'est pas du JSON (ex: "Request Entity Too Large")
          const text = await res.text().catch(() => "");
          errorMsg = text || `خطأ في الخادم (${res.status})`;
        }
        throw new Error(errorMsg);
      }

      setSuccess("✅ تم رفع SCORM بنجاح!");
      setShowImportModal(false);
      setScormFile(null);
      setScormTitle("");
      fetchScormPackages();
    } catch (err) {
      setScormUploadError(err.message);
    } finally {
      setUploadingScorm(false);
    }
  };

  const handlePublish = async (status) => {
    setSuccess(""); setError("");
    if (status === "PUBLISHED" && pretestQuestions.length === 0) {
      return setError("الاختبار القبلي إلزامي! أضف سؤالاً واحداً على الأقل قبل النشر.");
    }

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSuccess(`✅ ${status === "PUBLISHED" ? "تم نشر الدرس" : "تم وضع الدرس كمسودة"} !`);
        fetchCourse();
      }
    } catch { setError("خطأ في الخادم"); }
  };

  const handleAddChapter = async () => {
    if (!newChapter.title) return setError("عنوان الفصل إلزامي");
    setError(""); setSuccess("");
    try {
      const payload = {
        courseId: id,
        title: newChapter.title,
        objectifs: newChapter.objectifs,
      };

      if (newChapter.position !== null && newChapter.position !== "") {
        payload.position = parseInt(newChapter.position);
      }

      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess("✅ تم إضافة الفصل!");
        setNewChapter({ title: "", objectifs: "", position: null });
        setAddingChapter(false);
        fetchCourse();
      } else {
        const data = await res.json();
        setError(data.error || "خطأ في إضافة الفصل");
      }
    } catch { setError("خطأ في الخادم"); }
  };

  const handleMoveChapter = async (chapterId, direction) => {
    const sorted = [...course.chapters].sort((a, b) => a.ordre - b.ordre);
    const index = sorted.findIndex((c) => c.id === chapterId);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[newIndex];

    await Promise.all([
      fetch("/api/chapters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chapterId: current.id, newOrdre: target.ordre }),
      }),
      fetch("/api/chapters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chapterId: target.id, newOrdre: current.ordre }),
      }),
    ]);

    fetchCourse();
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!confirm("هل تريد حذف هذا الفصل وجميع ملحقاته؟")) return;
    try {
      const res = await fetch("/api/chapters", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chapterId }),
      });
      if (res.ok) { fetchCourse(); }
    } catch { setError("خطأ في الخادم"); }
  };

  const DASHBOARD_TABS = [
    { key: "overview", label: "فضاء المصمم", icon: "🎨" },
    { key: "courses", label: "دروسي", icon: "📚" },
    { key: "messages", label: "الرسائل", icon: "✉️" },
  ];

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }} dir="rtl">جارٍ تحميل الدرس...</div>;


  const sortedChapters = course?.chapters?.sort((a, b) => a.ordre - b.ordre) || [];

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <DashboardLayout
        user={user}
        roleIcon="🎨"
        customTitle={`إدارة: ${course?.title}`}
        tabs={DASHBOARD_TABS}
        activeTab="courses"
        onTabChange={(t) => router.push("/dashboard/designer")}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }} dir="rtl">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            background: "white",
            padding: "1.5rem 2rem",
            borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            border: "1px solid #edf2f7"
          }}>
            <div>
              <button onClick={() => router.push("/dashboard/designer")} style={{ ...btnBack, marginBottom: "0.5rem" }}>
                ← دروسي
              </button>
              <h1 style={{
                margin: 0,
                fontSize: "2.3rem",
                fontFamily: "'Amiri', 'Tajawal', serif",
                fontWeight: "700",
                background: "linear-gradient(135deg, #059669, #10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                {course?.title}
              </h1>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", fontFamily: "'Reem Kufi', 'Tajawal', sans-serif" }}>
                <span style={{ background: "#ebf8ff", color: "#2b6cb0", padding: "0.2rem 0.75rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "700" }}>{course?.matiere}</span>
                <span style={{ background: "#f0fff4", color: "#2f855a", padding: "0.2rem 0.75rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "700" }}>{course?.niveau}</span>
                <span style={{ background: "#fffaf0", color: "#c05621", padding: "0.2rem 0.75rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "700" }}>{course?.annee}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              <div style={{ display: "flex", background: "#f1f5f9", padding: "0.4rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <button
                  onClick={() => handlePublish("DRAFT")}
                  style={{
                    padding: "0.6rem 1.25rem",
                    borderRadius: "10px",
                    border: "none",
                    background: course?.status === "DRAFT" ? "#f97316" : "transparent",
                    color: course?.status === "DRAFT" ? "white" : "#64748b",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <span>📦</span> مسودة
                </button>
                <button
                  onClick={() => handlePublish("PUBLISHED")}
                  style={{
                    padding: "0.6rem 1.25rem",
                    borderRadius: "10px",
                    border: "none",
                    background: course?.status === "PUBLISHED" ? "#059669" : "transparent",
                    color: course?.status === "PUBLISHED" ? "white" : "#64748b",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <span>🚀</span> {course?.status === "PUBLISHED" ? "درس منشور" : "نشر"}
                </button>
              </div>

              <button
                onClick={() => router.push(`/dashboard/designer/courses/${id}/import-cours`)}
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9)",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
                }}
              >
                📚 استيراد درس
              </button>

              <button
                onClick={() => router.push(`/dashboard/designer/courses/${id}/import-zip`)}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                }}
              >
                📦 استيراد ZIP
              </button>

              <button
                onClick={() => router.push(`/dashboard/designer/courses/edit/${id}`)}
                style={{
                  ...btnPrimary,
                  background: "#f97316",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 12px rgba(249, 115, 22, 0.2)"
                }}
              >
                <span>✏️</span> تعديل المعلومات
              </button>
            </div>
          </div>

          {error && <div style={{ background: "#fff5f5", color: "#e53e3e", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #fed7d7" }}>❌ {error}</div>}
          {success && <div style={{ background: "#f0fff4", color: "#059669", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #c6f6d5" }}>✅ {success}</div>}

          {/* Onglets */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid #edf2f7" }}>
            {[
              { key: "info", label: "📑 معلومات" },
              { key: "pretest", label: `🧪 اختبار قبلي (${pretestQuestions.length})` },
              { key: "chapitres", label: `📖 فصول (${course?.chapters?.length || 0})` },
              { key: "scorm", label: `🎓 SCORM (${scormPackages.length})` },
              { key: "quiz", label: `🏁 اختبار نهائي (${course?.quizFinal?.questions?.length || 0})` }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "1rem 1.5rem",
                  border: "none",
                  background: "transparent",
                  fontSize: "1.05rem",
                  fontWeight: tab === t.key ? "700" : "500",
                  color: tab === t.key ? "#059669" : "#718096",
                  borderBottom: tab === t.key ? "4px solid #059669" : "4px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginBottom: "-2px"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.02)", border: "1px solid #edf2f7", minHeight: "500px" }}>
            {tab === "info" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <InfoBlock label="عنوان الدرس" value={course?.title} />
                </div>
                <InfoBlock label="المادة" value={course?.matiere} />
                <InfoBlock label="السنة" value={course?.annee} />
                <InfoBlock label="المستوى الدراسي" value={course?.niveau} />
                <InfoBlock label="الحالة" value={course?.status} />
                <div style={{ gridColumn: "span 2" }}>
                  <InfoBlockHtml label="الوصف" value={course?.description} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <InfoBlockHtml label="الأهداف البيداغوجية" value={course?.objectifs} />
                </div>
              </div>
            )}

            {tab === "pretest" && (
              <PretestTab
                courseId={id}
                questions={pretestQuestions}
                addingQ={addingPretestQ}
                setAddingQ={setAddingPretestQ}
                questionType={pretestQType}
                setQuestionType={setPretestQType}
                newQuestion={newPretestQ}
                setNewQuestion={setNewPretestQ}
                error={pretestError}
                setError={setPretestError}
                success={pretestSuccess}
                setSuccess={setPretestSuccess}
                onRefresh={fetchCourse}
                router={router}
              />
            )}

            {tab === "chapitres" && (
              <div>
                {sortedChapters.length === 0 && (
                  <p style={{ color: "#718096" }}>لا يوجد أي فصل — استخدم "استيراد درس" أو أضف يدوياً!</p>
                )}
                {sortedChapters.map((ch, index) => (
                  <div key={ch.id} style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "15px", marginBottom: "1rem", border: "1px solid #edf2f7" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ background: "#059669", color: "white", padding: "0.2rem 0.75rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "700", marginLeft: "1rem" }}>
                          الفصل {index + 1}
                        </span>
                        <strong style={{ fontSize: "1.1rem" }}>{ch.title}</strong>
                        {ch.objectifs && (
                          <div
                            className="rich-content"
                            dangerouslySetInnerHTML={{ __html: ch.objectifs }}
                            style={{ margin: "0.5rem 0 0", color: "#718096", fontSize: "0.9rem", lineHeight: "1.5" }}
                          />
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <button
                            onClick={() => handleMoveChapter(ch.id, "up")}
                            disabled={index === 0}
                            style={{ background: index === 0 ? "#e2e8f0" : "#718096", color: "white", border: "none", borderRadius: "4px", width: "24px", height: "24px", cursor: index === 0 ? "default" : "pointer", fontSize: "0.7rem" }}>
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveChapter(ch.id, "down")}
                            disabled={index === sortedChapters.length - 1}
                            style={{ background: index === sortedChapters.length - 1 ? "#e2e8f0" : "#718096", color: "white", border: "none", borderRadius: "4px", width: "24px", height: "24px", cursor: index === sortedChapters.length - 1 ? "default" : "pointer", fontSize: "0.7rem" }}>
                            ▼
                          </button>
                        </div>
                        <span style={{ fontSize: "0.85rem", color: "#718096" }}>
                          {ch.supports?.length || 0} ملحق(ات)
                        </span>
                        <button onClick={() => router.push(`/dashboard/designer/courses/${id}/chapters/${ch.id}`)} style={btnSmall}>
                          ✏️ إدارة
                        </button>
                        <button onClick={() => handleDeleteChapter(ch.id)} style={btnDanger}>🗑</button>
                      </div>
                    </div>
                  </div>
                ))}

                {addingChapter ? (
                  <div style={{ background: "#ebf8ff", padding: "1.25rem", borderRadius: "10px", marginTop: "1rem" }}>
                    <h3 style={{ margin: "0 0 1rem" }}>فصل جديد</h3>

                    <input
                      placeholder="عنوان الفصل *"
                      value={newChapter.title}
                      onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                      style={inputStyle}
                    />

                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>الأهداف الخاصة للفصل</label>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginTop: "0.75rem" }}>
                      <RichEditor
                        value={newChapter.objectifs}
                        onChange={(val) => setNewChapter({ ...newChapter, objectifs: val })}
                        placeholder="الأهداف الخاصة للفصل..."
                      />
                    </div>

                    <label style={{ ...labelStyle, marginTop: "0.75rem" }}>الموضع</label>
                    <select
                      value={newChapter.position ?? ""}
                      onChange={(e) => setNewChapter({ ...newChapter, position: e.target.value === "" ? null : e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">في النهاية (افتراضي)</option>
                      {sortedChapters.map((_, i) => (
                        <option key={i} value={i + 1}>
                          الموضع {i + 1}
                        </option>
                      ))}
                      <option value={sortedChapters.length + 1}>الموضع {sortedChapters.length + 1} (في النهاية)</option>
                    </select>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button onClick={handleAddChapter} style={btnSuccess}>✅ إضافة</button>
                      <button onClick={() => { setAddingChapter(false); setNewChapter({ title: "", objectifs: "", position: null }); }} style={btnWarning}>إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
                    <button onClick={() => setAddingChapter(true)} style={{ ...btnPrimary, background: "linear-gradient(135deg, #059669, #10b981)" }}>
                      ➕ إضافة فصل
                    </button>
                    <button onClick={() => router.push(`/dashboard/designer/courses/${id}/import-cours`)} style={{ ...btnPrimary, background: "#3182ce" }}>
                      📚 استيراد درس
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* 🎓 NOUVEAU : ONGLET SCORM */}
            {/* ==================================================== */}
            {tab === "scorm" && (
              <div>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ margin: 0, color: "#2d3748" }}>🎓 وحدات SCORM ({scormPackages.length})</h2>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={fetchScormPackages}
                      style={{ ...btnSmall, background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
                    >
                      🔄 تحديث
                    </button>
                    <button
                      onClick={() => setShowImportModal(true)}
                      style={{ ...btnSmall, background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                    >
                      📦 استيراد SCORM
                    </button>
                  </div>
                </div>

                {scormError && (
                  <div style={{ background: "#fff5f5", color: "#e53e3e", padding: "1rem", borderRadius: "10px", marginBottom: "1rem", border: "1px solid #fed7d7" }}>
                    ❌ {scormError}
                  </div>
                )}

                {scormLoading ? (
                  <div style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                    جارٍ تحميل SCORM...
                  </div>
                ) : scormPackages.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "3rem 2rem",
                    background: "#f8fafc",
                    borderRadius: "15px",
                    border: "2px dashed #cbd5e0"
                  }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
                    <h3 style={{ margin: "0 0 0.5rem", color: "#2d3748" }}>لا توجد وحدة SCORM</h3>
                    <p style={{ color: "#718096", marginBottom: "1.5rem" }}>
                      قم باستيراد حزمة SCORM (.zip مع imsmanifest.xml) عبر زر "استيراد ZIP"
                    </p>
                    <button
                      onClick={() => setShowImportModal(true)}
                      style={{ ...btnPrimary, background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                    >
                      📦 استيراد أول SCORM لي
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {scormPackages.map((scorm) => (
                      <div
                        key={scorm.id}
                        style={{
                          background: "linear-gradient(135deg, #f8fafc, #eff6ff)",
                          padding: "1.5rem",
                          borderRadius: "15px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1rem"
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "250px" }}>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                            <span style={{
                              background: scorm.version === "2004" ? "#8b5cf6" : "#06b6d4",
                              color: "white",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "10px",
                              fontSize: "0.75rem",
                              fontWeight: "700"
                            }}>
                              SCORM {scorm.version}
                            </span>
                            <strong style={{ fontSize: "1.15rem", color: "#2d3748" }}>
                              {scorm.title}
                            </strong>
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            📄 {scorm.launchFile} • 📁 {scorm.storagePath}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                            تم الاستيراد في {new Date(scorm.createdAt).toLocaleDateString("ar-DZ")}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => setActiveScorm(scorm)}
                            style={{
                              ...btnSmall,
                              background: "linear-gradient(135deg, #059669, #10b981)",
                              padding: "0.5rem 1.25rem"
                            }}
                          >
                            ▶️ تشغيل
                          </button>
                          <button
                            onClick={() => handleDeleteScorm(scorm.id)}
                            style={{ ...btnDanger, padding: "0.5rem 0.8rem" }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "quiz" && (
              <div>
                <div style={{ background: "#f8fafc", padding: "2rem", borderRadius: "20px", border: "1px solid #edf2f7", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏁</div>
                  <h2 style={{ margin: "0 0 1rem", color: "#2d3748" }}>الاختبار النهائي</h2>

                  {course?.quizFinal ? (
                    <div>
                      <p style={{ color: "#059669", fontWeight: "600", marginBottom: "1.5rem" }}>
                        ✅ تم إعداد الاختبار النهائي — {course.quizFinal.questions?.length || 0} سؤال / أسئلة
                      </p>
                      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <button onClick={() => router.push(`/dashboard/designer/courses/${id}/quiz`)} style={{ ...btnPrimary, background: "linear-gradient(135deg, #059669, #10b981)" }}>
                          ✏️ إدارة الاختبار النهائي
                        </button>
                        <button onClick={() => router.push(`/dashboard/designer/courses/${id}/import-quiz`)} style={{ ...btnPrimary, background: "#f97316" }}>
                          📥 إعادة استيراد الاختبار
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: "#718096", marginBottom: "1.5rem" }}>
                        الاختبار النهائي هو التقييم الختامي للدرس.
                      </p>
                      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <button onClick={() => router.push(`/dashboard/designer/courses/${id}/quiz`)} style={{ ...btnPrimary, background: "linear-gradient(135deg, #059669, #10b981)" }}>
                          ➕ إنشاء الاختبار النهائي
                        </button>
                        <button onClick={() => router.push(`/dashboard/designer/courses/${id}/import-quiz`)} style={{ ...btnPrimary, background: "#f97316" }}>
                          📥 استيراد اختبار نهائي
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* 🎓 MODAL PLAYER SCORM */}
        {/* ==================================================== */}
        {activeScorm && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            padding: "1rem"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "white",
              padding: "1rem 1.5rem",
              borderRadius: "12px 12px 0 0",
              borderBottom: "1px solid #e2e8f0"
            }}>
              <div>
                <strong style={{ fontSize: "1.1rem", color: "#2d3748" }}>
                  🎓 {activeScorm.title}
                </strong>
                <span style={{
                  marginLeft: "0.75rem",
                  background: activeScorm.version === "2004" ? "#8b5cf6" : "#06b6d4",
                  color: "white",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: "700"
                }}>
                  SCORM {activeScorm.version}
                </span>
              </div>
              <button
                onClick={() => setActiveScorm(null)}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "0.95rem"
                }}
              >
                ✕ إغلاق
              </button>
            </div>

            <iframe
              src={`/scorm/${activeScorm.storagePath}/${activeScorm.launchFile}`}
              style={{
                flex: 1,
                width: "100%",
                border: "none",
                background: "white",
                borderRadius: "0 0 12px 12px"
              }}
              allow="fullscreen"
              title={`SCORM: ${activeScorm.title}`}
            />
          </div>
        )}

        {/* ==================================================== */}
        {/* 🎓 MODAL UPLOAD SCORM */}
        {/* ==================================================== */}
        {showImportModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center"
          }} dir="rtl">
            <div style={{
              background: "white", padding: "2rem", borderRadius: "15px",
              width: "100%", maxWidth: "500px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}>
              <h2 style={{ margin: "0 0 1rem", color: "#2d3748" }}>📦 استيراد SCORM</h2>
              
              {scormUploadError && (
                <div style={{ color: "#e53e3e", background: "#fff5f5", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                  {scormUploadError}
                </div>
              )}

              <label style={labelStyle}>عنوان الوحدة</label>
              <input
                type="text"
                value={scormTitle}
                onChange={(e) => setScormTitle(e.target.value)}
                placeholder="مثال: دورة الأمان"
                style={{ ...inputStyle, marginBottom: "1rem" }}
              />

              <label style={labelStyle}>ملف ZIP</label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setScormFile(e.target.files[0])}
                style={{ ...inputStyle, marginBottom: "1.5rem", textAlign: "right" }}
              />

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setShowImportModal(false); setScormUploadError(""); setScormFile(null); setScormTitle(""); }}
                  style={{ ...btnWarning, background: "#cbd5e1", color: "#475569" }}
                  disabled={uploadingScorm}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleUploadScorm}
                  style={{ ...btnPrimary, background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                  disabled={uploadingScorm}
                >
                  {uploadingScorm ? "⏳ جاري الرفع..." : "✅ رفع"}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ====================================================
// COMPOSANTS EXISTANTS (inchangés)
// ====================================================
function InfoBlock({ label, value }) {
  return (
    <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #edf2f7" }}>
      <div style={{ fontWeight: "700", color: "#059669", marginBottom: "0.5rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ color: value ? "#2d3748" : "#a0aec0", fontSize: "1.05rem", lineHeight: "1.5" }}>{value || "غير محدد"}</div>
    </div>
  );
}

function InfoBlockHtml({ label, value }) {
  return (
    <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #edf2f7" }}>
      <div style={{ fontWeight: "700", color: "#059669", marginBottom: "0.5rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {value ? (
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: value }}
          style={{ color: "#2d3748", fontSize: "1.05rem", lineHeight: "1.6" }}
        />
      ) : (
        <div style={{ color: "#a0aec0", fontSize: "1.05rem", fontStyle: "italic" }}>غير محدد</div>
      )}
    </div>
  );
}

function PretestTab({ courseId, questions, addingQ, setAddingQ, questionType, setQuestionType, newQuestion, setNewQuestion, error, setError, success, setSuccess, onRefresh, router }) {
  const handleDeleteQuestion = async (questionId) => {
    if (!confirm("Supprimer cette question ?")) return;
    try {
      await fetch("/api/pretest/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId }),
      });
      onRefresh();
    } catch { setError("Erreur serveur"); }
  };

  const handleAddQuestion = async () => {
    const parsedCourseId = parseInt(courseId);
    if (!courseId || isNaN(parsedCourseId)) {
      return setError("Erreur : ID du cours invalide. Rechargez la page.");
    }
    let finalTexte = newQuestion.texte;
    let finalReponse = newQuestion.reponse;
    let finalChoix = newQuestion.choix;

    if (questionType === "GAP") {
      finalTexte = newQuestion.texteTrous;
      finalReponse = JSON.stringify(newQuestion.reponse.split(",").map(r => r.trim()).filter(Boolean));
      finalChoix = [];
    } else if (questionType === "MATCHING") {
      const pairesObj = {};
      newQuestion.paires.forEach(p => { if (p.gauche.trim() && p.droite.trim()) pairesObj[p.gauche] = p.droite; });
      finalReponse = JSON.stringify(pairesObj);
      finalChoix = [];
    } else if (questionType === "ORDERING") {
      const elements = newQuestion.elements.filter(e => e.trim());
      finalReponse = JSON.stringify(elements);
      finalChoix = [];
    } else if (questionType === "QCM_MULTIPLE") {
      finalReponse = JSON.stringify(newQuestion.reponsesMultiples);
    } else if (questionType === "VRAI_FAUX") {
      finalChoix = ["Vrai", "Faux"];
    }

    if (!finalTexte) return setError("Le texte de la question est obligatoire.");
    if (!finalReponse && questionType !== "OUVERTE") return setError("La réponse est obligatoire.");

    setError(""); setSuccess("");
    try {
      const payload = {
        courseId: parsedCourseId,
        texte: finalTexte,
        type: questionType,
        reponse: finalReponse,
        points: newQuestion.points,
        choix: finalChoix,
      };
      const res = await fetch("/api/pretest/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess("✅ Question ajoutée avec succès !");
        setAddingQ(false);
        setNewQuestion(emptyPretestQ);
        onRefresh();
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'ajout de la question.");
      }
    } catch { setError("Erreur serveur"); }
  };

  const handleDeletePretest = async () => {
    if (!confirm("Attention ! Voulez-vous vraiment vider tout le pretest ? Toutes les questions seront supprimées.")) return;
    try {
      await fetch("/api/pretest/questions", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ courseId }),
      });
      onRefresh();
    } catch {}
  };

  return (
    <div>
      {!addingQ && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <button onClick={() => setAddingQ(true)} style={{ ...btnPrimary, background: "linear-gradient(135deg, #059669, #10b981)" }}>
            ➕ Ajouter une question
          </button>
          <button onClick={() => router.push(`/dashboard/designer/courses/${courseId}/import-pretest`)} style={{ ...btnPrimary, background: "#f97316" }}>
            📥 Importer un pretest
          </button>
          {questions.length > 0 && (
            <button onClick={handleDeletePretest} style={{ ...btnDanger, padding: "0.75rem 1.5rem" }}>
              🗑 Vider le pretest
            </button>
          )}
        </div>
      )}

      {error && <p style={{ color: "red", background: "#fff5f5", padding: "0.75rem", borderRadius: "6px" }}>{error}</p>}
      {success && <p style={{ color: "green", background: "#f0fff4", padding: "0.75rem", borderRadius: "6px" }}>{success}</p>}

      {questions.length === 0 && !addingQ && (
        <p style={{ color: "#718096", textAlign: "center", padding: "2rem", background: "#f8fafc", borderRadius: "15px" }}>
          Aucune question — ajoutez votre première question au pretest !
        </p>
      )}

      {questions.map((q, index) => (
        <div key={q.id} style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "15px", marginBottom: "1rem", border: "1px solid #edf2f7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ background: typeQColor(q.type), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", marginRight: "0.5rem" }}>{q.type}</span>
              <strong>Q{index + 1} : {q.texte}</strong>
              <span style={{ color: "#718096", fontSize: "0.85rem", marginLeft: "0.5rem" }}>({q.points} pt{q.points > 1 ? "s" : ""})</span>
            </div>
            <button onClick={() => handleDeleteQuestion(q.id)} style={btnDanger}>🗑</button>
          </div>
          {(q.type === "QCM" || q.type === "VRAI_FAUX") && (
            <ul style={{ marginTop: "0.5rem" }}>
              {q.choix.map((c, i) => (
                <li key={i} style={{ color: c === q.reponse ? "#059669" : "#4a5568", fontWeight: c === q.reponse ? "bold" : "normal" }}>
                  {c === q.reponse ? "✅ " : "○ "}{c}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {addingQ && (
        <div style={{ background: "#eff6ff", padding: "1.25rem", borderRadius: "12px", marginTop: "1rem", border: "1px solid #bfdbfe" }}>
          <h3 style={{ margin: "0 0 1rem" }}>Nouvelle question</h3>

          <label style={labelStyle}>Type de question</label>
          <select value={questionType} onChange={(e) => { setQuestionType(e.target.value); setNewQuestion(emptyPretestQ); }} style={inputStyle}>
            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Points</label>
          <input type="number" min="1" max="10" value={newQuestion.points}
            onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
            style={{ ...inputStyle, width: "80px" }} />

          {questionType === "QCM" && (
            <div style={{ marginTop: "0.75rem" }}>
              <label style={labelStyle}>Question *</label>
              <input placeholder="Question..." value={newQuestion.texte} onChange={(e) => setNewQuestion({ ...newQuestion, texte: e.target.value })} style={inputStyle} />
              <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Choix *</label>
              {newQuestion.choix.map((c, i) => (
                <input key={i} placeholder={`Choix ${i + 1}`} value={c}
                  onChange={(e) => { const choix = [...newQuestion.choix]; choix[i] = e.target.value; setNewQuestion({ ...newQuestion, choix }); }}
                  style={{ ...inputStyle, marginBottom: "0.5rem" }} />
              ))}
              <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Bonne réponse *</label>
              <select value={newQuestion.reponse} onChange={(e) => setNewQuestion({ ...newQuestion, reponse: e.target.value })} style={inputStyle}>
                <option value="">Choisir</option>
                {newQuestion.choix.filter((c) => c.trim()).map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
            <button onClick={handleAddQuestion} style={btnSuccess}>✅ Ajouter</button>
            <button onClick={() => { setAddingQ(false); setNewQuestion(emptyPretestQ); }} style={btnWarning}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnBack = { background: "none", border: "none", color: "#f97316", cursor: "pointer", marginBottom: "1rem", fontSize: "0.95rem", fontWeight: "600" };
const btnPrimary = { background: "linear-gradient(135deg, #059669, #10b981)", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "1rem", fontWeight: "600", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" };
const btnSuccess = { background: "#059669", color: "white", padding: "0.6rem 1.25rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const btnWarning = { background: "#f97316", color: "white", padding: "0.6rem 1.25rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const btnDanger = { background: "#ef4444", color: "white", padding: "0.4rem 0.8rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const btnSmall = { background: "linear-gradient(135deg, #059669, #10b981)", color: "white", padding: "0.4rem 1rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600" };
const inputStyle = { width: "100%", padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "1rem", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" };
const labelStyle = { display: "block", marginBottom: "0.4rem", fontWeight: "700", color: "#4a5568", fontSize: "0.9rem" };

function typeQColor(type) {
  const colors = {
    QCM: "#1e40af",
    QCM_MULTIPLE: "#7c3aed",
    VRAI_FAUX: "#059669",
    OUVERTE: "#f97316",
    GAP: "#0d9488",
    MATCHING: "#dc2626",
    ORDERING: "#0ea5e9"
  };
  return colors[type] || "#475569";
}