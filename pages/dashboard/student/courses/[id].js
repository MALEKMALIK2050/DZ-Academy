import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ForumEmbed from "@/components/forum/ForumEmbed";
import YouTubePlayer from "@/components/YouTubePlayer";
import PretestModern from "@/components/PretestModern";
import RemediationRequest from "@/components/student/RemediationRequest";

function typeColor(type) {
  const colors = { PDF: "#e53e3e", VIDEO: "#3182ce", IMAGE: "#38a169", PPT: "#dd6b20", SCORM: "#805ad5", ARTICULATE: "#d69e2e", FORUM: "#0284c7" };
  return colors[type] || "#718096";
}

const btnPrimary = { background: "#40916C", color: "white", padding: "0.6rem 1.2rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" };
const btnSuccess = { background: "#40916C", color: "white", padding: "0.6rem 1.2rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" };

export default function StudentCourse() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pretest, setPretest] = useState(null);
  const [pretestCompleted, setPretestCompleted] = useState(false);
  const [pretestFeedback, setPretestFeedback] = useState(null);
  const [pretestAnswers, setPretestAnswers] = useState({});
  const [pretestSubmitting, setPretestSubmitting] = useState(false);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [showCorrections, setShowCorrections] = useState(false);
  const [chapterProgress, setChapterProgress] = useState({});
  const [quizStats, setQuizStats] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { if (!id) return; fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur chargement"); return; }
      setCourse(data);
      if (data.pretest) {
        setPretest(data.pretest);
        const resultRes = await fetch(`/api/pretest/${data.pretest.id}/result?courseId=${data.id}`, { credentials: "include" });
        if (resultRes.ok) { const result = await resultRes.json(); setPretestCompleted(!!result); if (result?.feedback) setPretestFeedback(result.feedback); }
      }
      const progRes = await fetch(`/api/student/progress?courseId=${data.id}`, { credentials: "include" });
      const progData = await progRes.json();
      if (progRes.ok) setChapterProgress(progData.chapterProgress || {});
      const stats = {};
      for (const ch of data.chapters || []) {
        if (ch.quiz) {
          const qRes = await fetch(`/api/student/quiz?quizId=${ch.quiz.id}`, { credentials: "include" });
          const qData = await qRes.json();
          if (qRes.ok) stats[ch.quiz.id] = qData;
        }
      }
      if (data.quizFinal) {
        const qRes = await fetch(`/api/student/quiz?quizId=${data.quizFinal.id}`, { credentials: "include" });
        const qData = await qRes.json();
        if (qRes.ok) stats[data.quizFinal.id] = qData;
      }
      setQuizStats(stats);
    } catch (e) { console.error(e); setError("Erreur serveur"); } finally { setLoading(false); }
  };

  const handlePretestSubmit = async (answers) => {
    try {
      setPretestSubmitting(true);
      const res = await fetch(`/api/student/submit-pretest?courseId=${course.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ reponses: answers }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur soumission"); return; }
      setPretestCompleted(true);
      if (data.data?.feedback) setPretestFeedback(data.data.feedback);
      if (course?.chapters?.length > 0) setActiveChapter(course.chapters[0]);
    } catch (error) { console.error(error); setError("Erreur de connexion"); } finally { setPretestSubmitting(false); }
  };

  const isChapterUnlocked = (index) => {
    if (pretest && !pretestCompleted) return false;
    if (index === 0) return true;
    const prevChapter = course?.chapters?.[index - 1];
    if (!prevChapter) return false;
    const prevLu = chapterProgress[prevChapter.id]?.lu;
    if (!prevLu) return false;
    if (prevChapter.quiz) { const prevQuizStat = quizStats[prevChapter.quiz.id]; if (!prevQuizStat?.reussi) return false; }
    return true;
  };

  const handleOpenChapter = (ch, index) => { if (!isChapterUnlocked(index)) return; setActiveChapter(ch); setActiveQuiz(null); setQuizResult(null); setQuizAnswers({}); setError(""); setMobileMenuOpen(false); };
  const handleMarkRead = async (chapterId) => { try { const res = await fetch("/api/student/progress", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ chapterId, courseId: id }) }); if (res.ok) setChapterProgress((prev) => ({ ...prev, [chapterId]: { lu: true } })); } catch (e) { console.error(e); } };
  const isSommatifUnlocked = () => { if (!course?.chapters?.length) return false; return course.chapters.every((ch) => { const lu = chapterProgress[ch.id]?.lu; const quizOk = !ch.quiz || quizStats[ch.quiz.id]?.reussi; return lu && quizOk; }); };
  const handleOpenSommatif = () => { if (!isSommatifUnlocked()) return; setActiveChapter(null); setActiveQuiz(course.quizFinal); setQuizResult(null); setQuizAnswers({}); setError(""); setMobileMenuOpen(false); };
  const handleSubmitQuiz = async (quiz) => { try { setQuizSubmitting(true); const res = await fetch("/api/student/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ quizId: quiz.id, reponses: quizAnswers }) }); const data = await res.json(); if (res.ok || res.status === 403) { setQuizResult(data); window.scrollTo({ top: 0, behavior: "smooth" }); if (!data.reussi) setShowCorrections(true); setQuizStats((prev) => ({ ...prev, [quiz.id]: { score: data.score, tentatives: data.tentatives, reussi: data.reussi, bloque: data.bloque } })); if (data.reussi) fetchCourse(); } else { setError(data.error || "Erreur soumission"); } } catch (e) { console.error(e); setError("Erreur serveur"); } finally { setQuizSubmitting(false); } };

  if (loading) return <p style={{ padding: "2rem" }}>Chargement...</p>;
  if (error && !course) return <p style={{ color: "red", padding: "2rem" }}>{error}</p>;

  const sommatifUnlocked = isSommatifUnlocked();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const getMatiereLabel = (matiere) => {
    const matieres = { math: "Mathématiques", physique: "Physique", svt: "SVT", informatique: "Informatique", francais: "Français", anglais: "Anglais", arabe: "Arabe", philosophie: "Philosophie", histoire: "Histoire-Géographie" };
    return matieres[matiere] || matiere || "Matière";
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)", padding: isMobile ? "0.8rem 1rem" : "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <button onClick={() => router.push("/dashboard/student")} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", cursor: "pointer", fontSize: isMobile ? "0.9rem" : "1rem", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: "500" }}>← Retour</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? "1rem" : "1.3rem", fontWeight: "600", color: "white" }}>📘 COURS : {course?.title || "Chargement..."}</h1>
            <p style={{ margin: "0.2rem 0 0", fontSize: isMobile ? "0.7rem" : "0.85rem", color: "#A8D8EA" }}>{getMatiereLabel(course?.matiere)} • {course?.niveau === "college" ? "Collège" : "Lycée"} • {course?.annee || "Année"}</p>
          </div>
          {isMobile && <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: "1.3rem", padding: "0.5rem", borderRadius: "8px", cursor: "pointer", width: "36px", height: "36px" }}>{mobileMenuOpen ? "✕" : "☰"}</button>}
        </div>

        {/* Container principal */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "calc(100vh - 80px)" }}>

          {/* Sidebar */}
          {(!isMobile || mobileMenuOpen) && (
            <div style={{ background: "#F8F9FA", padding: isMobile ? "1rem" : "1.5rem 1rem", overflowY: "auto", width: isMobile ? "100%" : "300px", minHeight: isMobile ? "auto" : "calc(100vh - 80px)", borderRight: isMobile ? "none" : "1px solid #E9ECEF", boxSizing: "border-box" }}>
              <div style={{ background: "#2D6A4F", padding: isMobile ? "1rem" : "1.25rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: isMobile ? "2rem" : "2.5rem", marginBottom: "0.5rem" }}>{pretestCompleted ? "🚀" : "🎯"}</div>
                <h3 style={{ margin: "0 0 0.3rem", color: "white", fontSize: isMobile ? "1rem" : "1.1rem", fontWeight: "600" }}>{pretestCompleted ? "Prêt à apprendre!" : "Évalue-toi d'abord"}</h3>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: isMobile ? "0.7rem" : "0.8rem" }}>{pretestCompleted ? "Tu as les bases. Explore les chapitres!" : "Le pretest t'aidera à vérifier tes connaissances."}</p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                {(() => { const total = course?.chapters?.length || 0; const done = course?.chapters?.filter((ch) => chapterProgress[ch.id]?.lu && (!ch.quiz || quizStats[ch.quiz.id]?.reussi)).length || 0; const pct = total > 0 ? Math.round((done / total) * 100) : 0; return (<><div style={{ display: "flex", justifyContent: "space-between", color: "#1B4332", fontSize: "0.8rem", marginBottom: "0.5rem", fontWeight: "600" }}><span>📊 Progression</span><span style={{ background: "#40916C", color: "white", padding: "0.2rem 0.5rem", borderRadius: "20px", fontSize: "0.7rem" }}>{pct}%</span></div><div style={{ background: "#E9ECEF", borderRadius: "10px", height: "8px", overflow: "hidden" }}><div style={{ background: "linear-gradient(90deg, #40916C, #74C69D)", width: `${pct}%`, height: "100%", transition: "width 0.3s ease", borderRadius: "10px" }} /></div></>); })()}
              </div>

              <h2 style={{ color: "#1B4332", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.8rem", fontWeight: "700", borderLeft: "3px solid #40916C", paddingLeft: "0.75rem" }}>📖 Chapitres</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {course?.chapters?.map((ch, i) => {
                  const unlocked = isChapterUnlocked(i);
                  const lu = chapterProgress[ch.id]?.lu;
                  const quizOk = !ch.quiz || quizStats[ch.quiz.id]?.reussi;
                  const completed = lu && quizOk;
                  const active = activeChapter?.id === ch.id && !activeQuiz;
                  return (<div key={ch.id} onClick={() => handleOpenChapter(ch, i)} style={{ padding: "0.6rem 0.8rem", borderRadius: "10px", cursor: unlocked ? "pointer" : "not-allowed", background: active ? "#2D6A4F" : completed ? "#E8F5E9" : unlocked ? "white" : "#F8F9FA", color: active ? "white" : completed ? "#1B4332" : unlocked ? "#1B4332" : "#ADB5BD", opacity: unlocked ? 1 : 0.6, display: "flex", alignItems: "center", gap: "0.6rem", border: active ? "1px solid #40916C" : "1px solid #E9ECEF" }}>
                    <span style={{ fontSize: "1rem" }}>{!unlocked ? "🔒" : completed ? "✅" : "📘"}</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: "0.8rem", fontWeight: active ? "600" : "500" }}>{i + 1}. {ch.title}</div></div>
                  </div>);
                })}
              </div>

              {course?.quizFinal && (<div style={{ marginTop: "1.5rem" }}><h3 style={{ color: "#1B4332", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.8rem", fontWeight: "700", borderLeft: "3px solid #40916C", paddingLeft: "0.75rem" }}>🏆 Examen Final</h3><div onClick={handleOpenSommatif} style={{ padding: "0.6rem 0.8rem", borderRadius: "10px", cursor: sommatifUnlocked ? "pointer" : "not-allowed", background: activeQuiz?.id === course.quizFinal.id ? "#2D6A4F" : sommatifUnlocked ? "white" : "#F8F9FA", color: activeQuiz?.id === course.quizFinal.id ? "white" : "#1B4332", display: "flex", alignItems: "center", gap: "0.6rem", border: "1px solid #E9ECEF" }}><span style={{ fontSize: "1.2rem" }}>{!sommatifUnlocked ? "🔒" : "📝"}</span><div><div style={{ fontWeight: "600", fontSize: "0.85rem" }}>Test Final</div></div></div></div>)}
            </div>
          )}

          {/* Contenu principal */}
          <div style={{ padding: isMobile ? "1rem" : "1.5rem", overflowY: "auto", flex: 1, width: "100%", boxSizing: "border-box", background: "#F8F9FA" }}>
            {pretest && !pretestCompleted && <PretestModern pretest={pretest} course={course} user={user} loading={pretestSubmitting} onSubmit={handlePretestSubmit} />}
            {pretest && pretestCompleted && (<div style={{ background: "#E8F5E9", borderLeft: `4px solid ${pretestFeedback?.color === 'critique' ? '#dc2626' : '#40916C'}`, padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}><h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#1B4332" }}>✅ Pretest complété!</h3>{pretestFeedback && <div style={{ marginBottom: "0.75rem", fontSize: "0.85rem", color: "#2D6A4F", padding: "0.6rem", background: "white", borderRadius: "8px" }}>{pretestFeedback.message}</div>}<button onClick={() => { setPretestCompleted(false); setPretestAnswers({}); setPretestFeedback(null); }} style={btnPrimary}>🔄 Refaire le pretest</button></div>)}
            {activeChapter && !activeQuiz && (<div><h2 style={{ marginTop: 0, fontSize: "1.3rem", color: "#1B4332" }}>{activeChapter.title}</h2><div style={{ background: "white", padding: "1rem", borderRadius: "12px", marginBottom: "1rem" }}><p>Contenu du chapitre à afficher ici...</p></div></div>)}
            {activeQuiz && (<div><h2>Quiz</h2><p>Contenu du quiz...</p></div>)}
            {!activeChapter && !activeQuiz && (<div style={{ textAlign: "center", padding: "3rem" }}><div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div><h2 style={{ color: "#1B4332" }}>Bienvenue dans ce cours !</h2><p>Sélectionnez un chapitre dans le menu pour commencer.</p></div>)}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}