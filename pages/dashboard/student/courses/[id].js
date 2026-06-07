import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ForumEmbed from "@/components/forum/ForumEmbed";
import YouTubePlayer from "@/components/YouTubePlayer";
import PretestModern from "@/components/PretestModern";
import RemediationRequest from "@/components/student/RemediationRequest";

const SEUIL = 90;

function typeColor(type) {
  const colors = { PDF: "#e53e3e", VIDEO: "#3182ce", IMAGE: "#38a169", PPT: "#dd6b20", SCORM: "#805ad5", ARTICULATE: "#d69e2e", FORUM: "#0284c7" };
  return colors[type] || "#718096";
}

const btnPrimary = { background: "#3182ce", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" };
const btnSuccess = { background: "#38a169", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" };

export default function StudentCourse() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  // État du cours
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // État du pretest
  const [pretest, setPretest] = useState(null);
  const [pretestCompleted, setPretestCompleted] = useState(false);
  const [pretestFeedback, setPretestFeedback] = useState(null);
  const [pretestAnswers, setPretestAnswers] = useState({});
  const [pretestSubmitting, setPretestSubmitting] = useState(false);

  // État des chapitres et quizzes
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [showCorrections, setShowCorrections] = useState(false);

  // Progression et stats
  const [chapterProgress, setChapterProgress] = useState({});
  const [quizStats, setQuizStats] = useState({});
  
  // État pour le menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ====== FETCH INITIAL ======
  useEffect(() => {
    if (!id) return;
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur chargement");
        return;
      }

      setCourse(data);

      // Charger pretest et vérifier sa complétude
      if (data.pretest) {
        setPretest(data.pretest);
        const resultRes = await fetch(`/api/pretest/${data.pretest.id}/result?courseId=${data.id}`, { credentials: "include" });
        if (resultRes.ok) {
          const result = await resultRes.json();
          setPretestCompleted(!!result);
          if (result && result.feedback) setPretestFeedback(result.feedback);
        }
      }

      // Charger progression des chapitres
      const progRes = await fetch(`/api/student/progress?courseId=${data.id}`, { credentials: "include" });
      const progData = await progRes.json();
      if (progRes.ok) setChapterProgress(progData.chapterProgress || {});

      // Charger stats des quizzes
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

    } catch (e) {
      console.error("Erreur fetch:", e);
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  // ====== PRETEST ======
  const handlePretestSubmit = async (answers) => {
    try {
      setPretestSubmitting(true);
      setError("");

      const res = await fetch(`/api/student/submit-pretest?courseId=${course.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reponses: answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur soumission");
        return;
      }

      setPretestCompleted(true);
      if (data.data && data.data.feedback) setPretestFeedback(data.data.feedback);

      if (course?.chapters?.length > 0) {
        setActiveChapter(course.chapters[0]);
      }

    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur de connexion");
    } finally {
      setPretestSubmitting(false);
    }
  };

  // ====== CHAPITRES ======
  const isChapterUnlocked = (index) => {
    if (pretest && !pretestCompleted) {
      return false;
    }

    if (index === 0) return true;

    const prevChapter = course?.chapters?.[index - 1];
    if (!prevChapter) return false;

    const prevLu = chapterProgress[prevChapter.id]?.lu;
    if (!prevLu) return false;

    if (prevChapter.quiz) {
      const prevQuizStat = quizStats[prevChapter.quiz.id];
      if (!prevQuizStat?.reussi) return false;
    }

    return true;
  };

  const handleOpenChapter = (ch, index) => {
    if (!isChapterUnlocked(index)) return;
    setActiveChapter(ch);
    setActiveQuiz(null);
    setQuizResult(null);
    setQuizAnswers({});
    setError("");
    setMobileMenuOpen(false);
  };

  const handleMarkRead = async (chapterId) => {
    try {
      const res = await fetch("/api/student/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chapterId, courseId: id }),
      });
      if (res.ok) {
        setChapterProgress((prev) => ({ ...prev, [chapterId]: { lu: true } }));
      }
    } catch (e) {
      console.error("Erreur mark read:", e);
    }
  };

  // ====== QUIZZES ======
  const isSommatifUnlocked = () => {
    if (!course?.chapters?.length) return false;
    return course.chapters.every((ch, i) => {
      const lu = chapterProgress[ch.id]?.lu;
      const quizOk = !ch.quiz || quizStats[ch.quiz.id]?.reussi;
      return lu && quizOk;
    });
  };

  const handleOpenSommatif = () => {
    if (!isSommatifUnlocked()) return;
    setActiveChapter(null);
    setActiveQuiz(course.quizFinal);
    setQuizResult(null);
    setQuizAnswers({});
    setError("");
    setMobileMenuOpen(false);
  };

  const handleSubmitQuiz = async (quiz) => {
    try {
      setQuizSubmitting(true);
      setError("");

      const res = await fetch("/api/student/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quizId: quiz.id, reponses: quizAnswers }),
      });

      const data = await res.json();

      if (res.ok || res.status === 403) {
        setQuizResult(data);
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (!data.reussi) setShowCorrections(true);

        setQuizStats((prev) => ({
          ...prev,
          [quiz.id]: {
            score: data.score,
            tentatives: data.tentatives,
            reussi: data.reussi,
            bloque: data.bloque,
          },
        }));

        if (data.reussi) fetchCourse();
      } else {
        setError(data.error || "Erreur soumission");
      }
    } catch (e) {
      console.error("Erreur:", e);
      setError("Erreur serveur");
    } finally {
      setQuizSubmitting(false);
    }
  };

  if (loading) return <p style={{ padding: "2rem" }}>Chargement...</p>;
  if (error && !course) return <p style={{ color: "red", padding: "2rem" }}>{error}</p>;

  const sommatifUnlocked = isSommatifUnlocked();

  // Styles responsives
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F5F5DC 0%, #FFF8E7 100%)" }}>

        {/* Header cours - Orange vif */}
        <div style={{ 
          background: "linear-gradient(135deg, #FF8C00, #FFB347)", 
          color: "white", 
          padding: isMobile ? "0.8rem 1rem" : "1rem 2rem", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
          boxShadow: "0 4px 15px rgba(255, 140, 0, 0.3)"
        }}>
          <button 
            onClick={() => router.push("/dashboard/student")} 
            style={{ 
              background: "rgba(255,255,255,0.2)", 
              border: "none", 
              color: "white", 
              cursor: "pointer", 
              fontSize: isMobile ? "1rem" : "1.3rem",
              padding: "0.5rem 1rem",
              borderRadius: "30px",
              fontWeight: "bold"
            }}
          >
            ← Retour
          </button>
          
          <div style={{ flex: 1, textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? "1.2rem" : "1.9rem", fontWeight: "800" }}>{course?.title}</h1>
            <p style={{ margin: "0.2rem 0 0", fontSize: isMobile ? "0.8rem" : "1rem", color: "#FFF8E7" }}>
              {[course?.matiere, course?.niveau, course?.annee].filter(Boolean).join(" • ")}
            </p>
          </div>

          {/* Bouton menu mobile */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                fontSize: "1.5rem",
                padding: "0.5rem",
                borderRadius: "30px",
                cursor: "pointer"
              }}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>

        {/* Container principal responsive */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          minHeight: "calc(100vh - 60px)"
        }}>

          {/* SIDEBAR - couleurs lumineuses et fun */}
          {(!isMobile || mobileMenuOpen) && (
            <div style={{
              background: "linear-gradient(135deg, #FFF8E7 0%, #FFF0D4 100%)",
              padding: isMobile ? "1rem" : "2rem 1rem",
              overflowY: "auto",
              width: isMobile ? "100%" : "350px",
              minHeight: isMobile ? "auto" : "calc(100vh - 60px)",
              borderRight: isMobile ? "none" : "2px solid #FFB347",
              boxSizing: "border-box",
              boxShadow: "inset 0 0 20px rgba(255, 180, 71, 0.1)"
            }}>

              {/* Header Sidebar - Orange vif */}
              <div style={{
                background: "linear-gradient(135deg, #FFB347, #FF8C00)",
                backdropFilter: "blur(10px)",
                padding: isMobile ? "1rem" : "1.5rem",
                borderRadius: "20px",
                marginBottom: "1.5rem",
                boxShadow: "0 8px 20px rgba(255, 140, 0, 0.3)",
                border: "none",
              }}>
                <div style={{ fontSize: isMobile ? "2rem" : "3rem", marginBottom: "0.5rem" }}>
                  {pretestCompleted ? "🚀" : "🎯"}
                </div>
                <h3 style={{
                  margin: "0 0 0.3rem",
                  color: "white",
                  fontSize: isMobile ? "1rem" : "1.25rem",
                  fontWeight: "700",
                }}>
                  {pretestCompleted ? "Prêt à apprendre!" : "Évalue-toi d'abord"}
                </h3>
                <p style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.9)",
                  fontSize: isMobile ? "0.75rem" : "0.9rem",
                  lineHeight: "1.4",
                }}>
                  {pretestCompleted
                    ? "Tu as les bases. Explore les chapitres!"
                    : "Le pretest t'aidera à vérifier tes connaissances."}
                </p>
              </div>

              {/* Progression */}
              <div style={{ marginBottom: "1.5rem" }}>
                {(() => {
                  const total = course?.chapters?.length || 0;
                  const done = course?.chapters?.filter((ch) => chapterProgress[ch.id]?.lu && (!ch.quiz || quizStats[ch.quiz.id]?.reussi)).length || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#5D4037",
                        fontSize: isMobile ? "0.85rem" : "1rem",
                        marginBottom: "0.8rem",
                        fontWeight: "600",
                      }}>
                        <span>🎯 Progression</span>
                        <span style={{ background: "#FFB347", color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px" }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{
                        background: "#FFE0B5",
                        borderRadius: "20px",
                        height: "12px",
                        overflow: "hidden",
                        border: "1px solid #FFB347",
                      }}>
                        <div style={{
                          background: "linear-gradient(90deg, #FF8C00, #FFB347)",
                          width: `${pct}%`,
                          height: "100%",
                          transition: "width 0.3s ease",
                          borderRadius: "20px"
                        }} />
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Chapitres */}
              <h2 style={{
                color: "#FF8C00",
                fontSize: isMobile ? "1rem" : "1.2rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                marginBottom: "1rem",
                fontWeight: "800",
                borderLeft: "4px solid #FFB347",
                paddingLeft: "0.75rem",
              }}>
                📖 Chapitres
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {course?.chapters?.map((ch, i) => {
                  const unlocked = isChapterUnlocked(i);
                  const lu = chapterProgress[ch.id]?.lu;
                  const quizOk = !ch.quiz || quizStats[ch.quiz.id]?.reussi;
                  const completed = lu && quizOk;
                  const active = activeChapter?.id === ch.id && !activeQuiz;
                  const bloque = ch.quiz && quizStats[ch.quiz.id]?.bloque;

                  return (
                    <div
                      key={ch.id}
                      onClick={() => handleOpenChapter(ch, i)}
                      style={{
                        padding: isMobile ? "0.75rem" : "1rem",
                        borderRadius: "16px",
                        cursor: unlocked ? "pointer" : "not-allowed",
                        background: active
                          ? "linear-gradient(135deg, #FFB347, #FF8C00)"
                          : completed
                          ? "linear-gradient(135deg, #E8F5E9, #C8E6C9)"
                          : unlocked
                          ? "white"
                          : "#F5F5F5",
                        color: active ? "white" : completed ? "#2E7D32" : unlocked ? "#5D4037" : "#BDBDBD",
                        opacity: unlocked ? 1 : 0.6,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        border: active ? "none" : completed ? "1px solid #A5D6A7" : "1px solid #FFE0B5",
                        boxShadow: active ? "0 4px 12px rgba(255, 140, 0, 0.3)" : "none",
                        transition: "all 0.2s ease",
                      }}>
                      <span style={{ fontSize: isMobile ? "1.2rem" : "1.4rem" }}>
                        {!unlocked ? "🔒" : completed ? "✨" : bloque ? "⚠️" : "📚"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: isMobile ? "0.85rem" : "1rem",
                          fontWeight: active ? "700" : "600",
                          whiteSpace: "normal",
                          wordBreak: "break-word"
                        }}>
                          {i + 1}. {ch.title}
                        </div>
                        {ch.quiz && unlocked && (
                          <div style={{
                            fontSize: "0.65rem",
                            color: active ? "rgba(255,255,255,0.8)" : "#FF8C00",
                            marginTop: "0.2rem",
                            fontWeight: "500"
                          }}>
                            Quiz {quizStats[ch.quiz.id]?.reussi ? "✅" : quizStats[ch.quiz.id]?.bloque ? "⛔" : quizStats[ch.quiz.id]?.tentatives ? `(${quizStats[ch.quiz.id].tentatives}/3)` : "📝"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Test Sommatif */}
              {course?.quizFinal && (
                <div style={{ marginTop: "1.5rem" }}>
                  <h3 style={{
                    color: "#FF8C00",
                    fontSize: isMobile ? "0.85rem" : "1rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.3em",
                    fontWeight: "800",
                    marginBottom: "1rem",
                    borderLeft: "4px solid #FFB347",
                    paddingLeft: "0.75rem",
                  }}>
                    🏆 Final
                  </h3>
                  <div
                    onClick={handleOpenSommatif}
                    style={{
                      padding: isMobile ? "0.75rem" : "1rem",
                      borderRadius: "16px",
                      cursor: sommatifUnlocked ? "pointer" : "not-allowed",
                      background: activeQuiz?.id === course.quizFinal.id
                        ? "linear-gradient(135deg, #FFB347, #FF8C00)"
                        : sommatifUnlocked
                        ? "white"
                        : "#F5F5F5",
                      color: activeQuiz?.id === course.quizFinal.id ? "white" : sommatifUnlocked ? "#5D4037" : "#BDBDBD",
                      opacity: sommatifUnlocked ? 1 : 0.6,
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      border: "1px solid #FFE0B5",
                      boxShadow: activeQuiz?.id === course.quizFinal.id ? "0 4px 12px rgba(255, 140, 0, 0.3)" : "none",
                      transition: "all 0.2s ease",
                    }}>
                    <span style={{ fontSize: isMobile ? "1.5rem" : "2rem" }}>
                      {!sommatifUnlocked ? "🔒" : quizStats[course.quizFinal.id]?.reussi ? "🏆" : "📝"}
                    </span>
                    <div>
                      <div style={{ fontWeight: "800", fontSize: isMobile ? "0.9rem" : "1.1rem", color: activeQuiz?.id === course.quizFinal.id ? "white" : "#FF8C00" }}>
                        Test Final
                      </div>
                      {sommatifUnlocked && quizStats[course.quizFinal.id]?.tentatives && (
                        <div style={{ fontSize: "0.65rem", color: activeQuiz?.id === course.quizFinal.id ? "rgba(255,255,255,0.8)" : "#FF8C00" }}>
                          {quizStats[course.quizFinal.id]?.reussi ? "Réussi ✅" : `${quizStats[course.quizFinal.id].tentatives}/3`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTENU PRINCIPAL */}
          <div style={{
            padding: isMobile ? "1rem" : "2rem",
            overflowY: "auto",
            flex: 1,
            width: "100%",
            boxSizing: "border-box"
          }}>

            {pretest && !pretestCompleted && (
              <PretestModern
                pretest={pretest}
                course={course}
                user={user}
                loading={pretestSubmitting}
                onSubmit={handlePretestSubmit}
              />
            )}

            {/* PRETEST COMPLÉTÉ */}
            {pretest && pretestCompleted && (
              <div style={{
                background: pretestFeedback?.color === 'red' ? '#fff5f5' : pretestFeedback?.color === 'yellow' ? '#fffff0' : '#f0fff4',
                border: `2px solid ${pretestFeedback?.color === 'red' ? '#e53e3e' : pretestFeedback?.color === 'yellow' ? '#ecc94b' : '#059669'}`,
                padding: isMobile ? "1rem" : "1.5rem",
                borderRadius: "12px",
                marginBottom: "1.5rem"
              }}>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: isMobile ? "1rem" : "1.2rem", color: pretestFeedback?.color === 'red' ? '#c53030' : pretestFeedback?.color === 'yellow' ? '#b7791f' : '#059669' }}>
                  {pretestFeedback?.level === 'critique' ? '⚠️ Attention !' : '✅ Pretest complété!'}
                </h3>
                {pretestFeedback && (
                  <div style={{ marginBottom: "0.75rem", fontSize: isMobile ? "0.9rem" : "1.1rem", fontWeight: "600", color: "#2d3748", padding: "0.75rem", background: "white", borderRadius: "8px", border: "1px dashed #cbd5e0" }}>
                    {pretestFeedback.message}
                  </div>
                )}
                <p style={{ color: "#4a5568", margin: "0 0 1rem", fontSize: isMobile ? "0.85rem" : "0.95rem" }}>
                  {pretestFeedback?.level === 'critique' 
                    ? "Nous vous conseillons de revoir les bases avant d'attaquer ce cours."
                    : "Vous pouvez maintenant accéder aux chapitres."}
                </p>
                <button
                  onClick={() => {
                    setPretestCompleted(false);
                    setPretestAnswers({});
                    setPretestFeedback(null);
                  }}
                  style={{ ...btnPrimary, padding: isMobile ? "0.5rem 1rem" : "0.75rem 1.5rem", fontSize: isMobile ? "0.85rem" : "1rem" }}
                >
                  🔄 Refaire le pretest
                </button>
              </div>
            )}

            {/* CHAPITRE ACTIF */}
            {activeChapter && !activeQuiz && (
              <div>
                <h2 style={{ marginTop: 0, fontSize: isMobile ? "1.3rem" : "1.8rem", color: "#FF8C00" }}>{activeChapter.title}</h2>

                {activeChapter.objectifs && (
                  <div style={{ background: "#FFE0B5", border: "1px solid #FFB347", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.9rem", color: "#5D4037" }}>
                    🎯 <strong>Objectifs :</strong> {activeChapter.objectifs}
                  </div>
                )}

                {/* Supports */}
                {activeChapter.supports?.length > 0 && (
                  <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                      {activeChapter.supports.map((s) => {
                        if (s.type === "TEXTE") {
                          return (
                            <div key={s.id} style={{ background: "white", border: "1px solid #FFB347", padding: isMobile ? "1rem" : "2rem", borderRadius: "10px", overflowX: "auto" }}>
                              {s.nom && (
                                <h3 style={{ margin: "0 0 1rem", color: "#FF8C00", borderBottom: "2px solid #FFE0B5", paddingBottom: "0.5rem", fontSize: isMobile ? "1rem" : "1.2rem" }}>
                                  {s.nom}
                                </h3>
                              )}
                              <div
                                dangerouslySetInnerHTML={{ __html: s.contenu }}
                                style={{ lineHeight: "1.6", color: "#012720af", fontSize: isMobile ? "0.9rem" : "1rem", overflowX: "auto" }}
                              />
                            </div>
                          );
                        }

                        if (s.type === "VIDEO") {
                          return (
                            <YouTubePlayer
                              key={s.id}
                              support={s}
                              userId={user?.id}
                              onProgress={({ supportId, completed, progression }) => {
                                console.log(`Video ${supportId}: ${progression}% ${completed ? "✅" : ""}`);
                              }}
                            />
                          );
                        }

                        if (s.type === "FORUM") {
                          return (
                            <div key={s.id} style={{ marginTop: "1rem" }}>
                              <ForumEmbed forumId={s.forumId} />
                            </div>
                          );
                        }

                        return (
                          <a
                            key={s.id}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: "white",
                              border: "1px solid #FFE0B5",
                              padding: "1rem",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              textDecoration: "none",
                              color: "#2d3748",
                              flexWrap: "wrap"
                            }}
                          >
                            <span style={{ background: typeColor(s.type), color: "white", padding: "0.3rem 0.8rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold" }}>
                              {s.type}
                            </span>
                            <span style={{ color: "#3182ce", fontWeight: "500", wordBreak: "break-word", flex: 1 }}>{s.nom || s.url}</span>
                            <span style={{ marginLeft: "auto", color: "#a0aec0" }}>→</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Marquer comme lu */}
                <div style={{ background: "white", border: "1px solid #FFB347", padding: isMobile ? "1rem" : "1.5rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
                  {!chapterProgress[activeChapter.id]?.lu ? (
                    <div>
                      <p style={{ margin: "0 0 1rem", color: "#5D4037" }}>
                        <strong>Avez-vous consulté toutes les ressources de ce chapitre ?</strong>
                      </p>
                      <button onClick={() => handleMarkRead(activeChapter.id)} style={{ ...btnSuccess, background: "linear-gradient(135deg, #FF8C00, #FFB347)", padding: isMobile ? "0.5rem 1rem" : "0.75rem 1.5rem", fontSize: isMobile ? "0.85rem" : "1rem", border: "none" }}>
                        ✅ J'ai terminé ce chapitre
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "#2E7D32", fontWeight: "bold" }}>
                      ✅ Chapitre consulté
                    </p>
                  )}
                </div>

                {/* Quiz formatif */}
                {activeChapter.quiz && chapterProgress[activeChapter.id]?.lu && (
                  <div style={{ background: "white", border: "1px solid #FFB347", padding: isMobile ? "1rem" : "1.5rem", borderRadius: "10px" }}>
                    <h3 style={{ margin: "0 0 0.5rem", fontSize: isMobile ? "1rem" : "1.2rem", color: "#FF8C00" }}>📝 Quiz formatif</h3>

                    {quizStats[activeChapter.quiz.id]?.reussi ? (
                      <p style={{ color: "#38a169", margin: 0 }}>
                        ✅ Quiz réussi ({quizStats[activeChapter.quiz.id].score}%)
                      </p>
                    ) : (
                      <div>
                        {quizStats[activeChapter.quiz.id]?.tentatives > 0 && (
                          <p style={{ color: "#dd6b20", fontSize: "0.9rem", margin: "0 0 0.75rem" }}>
                            ⚠️ Score précédent : {quizStats[activeChapter.quiz.id].score}% — Tentative(s) : {quizStats[activeChapter.quiz.id].tentatives}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            setActiveQuiz(activeChapter.quiz);
                            setQuizResult(null);
                            setQuizAnswers({});
                          }}
                          style={{ ...btnPrimary, background: "linear-gradient(135deg, #FF8C00, #FFB347)", padding: isMobile ? "0.5rem 1rem" : "0.75rem 1.5rem", fontSize: isMobile ? "0.85rem" : "1rem", border: "none" }}
                        >
                          {quizStats[activeChapter.quiz.id]?.tentatives ? "🔄 Réessayer" : "📝 Passer le quiz"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeChapter.quiz && !chapterProgress[activeChapter.id]?.lu && (
                  <div style={{ background: "#FFE0B5", border: "1px solid #FFB347", padding: "1rem", borderRadius: "8px" }}>
                    <p style={{ margin: 0, color: "#5D4037", fontSize: "0.9rem" }}>
                      🔒 Marquez le chapitre comme terminé pour accéder au quiz.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* QUIZ ACTIF */}
            {activeQuiz && (
              <QuizDisplay
                quiz={activeQuiz}
                answers={quizAnswers}
                setAnswers={setQuizAnswers}
                result={quizResult}
                submitting={quizSubmitting}
                onSubmit={handleSubmitQuiz}
                error={error}
                showCorrections={showCorrections}
                setShowCorrections={setShowCorrections}
                quizStats={quizStats}
                onRetry={() => {
                  setQuizResult(null);
                  setQuizAnswers({});
                  setShowCorrections(false);
                }}
                onNextChapter={(() => {
                  if (!activeQuiz || activeQuiz.type === "SOMMATIF") return null;
                  const currentIndex = course?.chapters?.findIndex(ch => ch.quiz?.id === activeQuiz.id);
                  const nextChapter = course?.chapters?.[currentIndex + 1];
                  if (!nextChapter) return null;
                  return () => {
                    setActiveQuiz(null);
                    setQuizResult(null);
                    setQuizAnswers({});
                    setShowCorrections(false);
                    setActiveChapter(nextChapter);
                  };
                })()}
              />
            )}

            {/* MESSAGE ACCUEIL */}
            {!activeChapter && !activeQuiz && (
              <div style={{ textAlign: "center", padding: isMobile ? "2rem 1rem" : "4rem 2rem", color: "#718096" }}>
                {pretestCompleted ? (
                  <>
                    <div style={{ fontSize: isMobile ? "3rem" : "4rem", marginBottom: "1rem" }}>📚</div>
                    <h2 style={{ fontSize: isMobile ? "1.3rem" : "1.8rem", color: "#FF8C00" }}>Bienvenue dans ce cours !</h2>
                    <p>Sélectionnez un chapitre dans le menu pour commencer.</p>
                    {isMobile && mobileMenuOpen === false && (
                      <button
                        onClick={() => setMobileMenuOpen(true)}
                        style={{ ...btnPrimary, background: "linear-gradient(135deg, #FF8C00, #FFB347)", marginTop: "1rem", border: "none" }}
                      >
                        📖 Voir les chapitres
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: isMobile ? "3rem" : "4rem", marginBottom: "1rem" }}>🎯</div>
                    <h2 style={{ fontSize: isMobile ? "1.3rem" : "1.8rem", color: "#FF8C00" }}>Avant de commencer...</h2>
                    <p>Complétez le pretest ci-dessus pour évaluer vos connaissances !</p>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ====== COMPOSANT QUIZ ======
function QuizDisplay({ quiz, answers, setAnswers, result, submitting, onSubmit, error, showCorrections, setShowCorrections, quizStats, onRetry, onNextChapter }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: isMobile ? "1.3rem" : "1.8rem", color: "#FF8C00" }}>
        📝 {quiz.type === "SOMMATIF" ? "Test sommatif final" : "Quiz formatif"}
      </h2>

      {result ? (
        // RÉSULTAT
        <div>
          <div style={{ textAlign: "center", padding: isMobile ? "1.5rem" : "3rem", background: "white", borderRadius: "12px", border: "1px solid #FFE0B5", marginBottom: "2rem" }}>
            <div style={{ fontSize: isMobile ? "3rem" : "4rem", marginBottom: "1rem" }}>
              {result.reussi ? "🎉" : result.bloque ? "⛔" : "💪"}
            </div>

            {result.bloque ? (
              <>
                <h2 style={{ color: "#e53e3e", fontSize: isMobile ? "1.2rem" : "1.5rem" }}>Tentatives épuisées</h2>
                <div style={{ background: "#fff5f5", border: "1.5px solid #feb2b2", padding: "1.5rem", borderRadius: "8px", maxWidth: "560px", margin: "0 auto" }}>
                  <p style={{ color: "#742a2a", fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem" }}>
                    ⛔ Vous avez utilisé vos 3 tentatives sans atteindre le score requis (90%).
                  </p>
                  <p style={{ color: "#9b2c2c", fontSize: "0.85rem", fontStyle: "italic", margin: "0 0 1rem" }}>
                    🔒 Le chapitre suivant restera verrouillé jusqu'au déblocage par votre enseignant.
                  </p>
                  <RemediationRequest quiz={quiz} quizResult={result} score={result.score} />
                </div>
              </>
            ) : (
              <>
                <h2 style={{ color: result.reussi ? "#38a169" : "#dd6b20", fontSize: isMobile ? "2rem" : "3rem", margin: "0 0 0.5rem" }}>
                  {result.score}%
                </h2>
                <p style={{ color: "#718096", marginBottom: "0.5rem" }}>
                  {result.correct} / {result.total} points
                </p>
                <p style={{ color: "#718096", marginBottom: "1.5rem" }}>
                  Tentative {result.tentatives} / 3
                </p>

                {result.reussi && (
                  <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                    <p style={{ color: "#276749", fontWeight: "bold", margin: "0 0 1rem" }}>
                      {result.message}
                    </p>
                    {onNextChapter && (
                      <button onClick={onNextChapter} style={{ background: "linear-gradient(135deg, #FF8C00, #FFB347)", color: "white", padding: isMobile ? "0.5rem 1rem" : "0.75rem 1.5rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: isMobile ? "0.85rem" : "1rem", fontWeight: "700" }}>
                        ➡️ Chapitre suivant
                      </button>
                    )}
                  </div>
                )}

                {!result.reussi && (
                  <div style={{ background: "#fffbeb", border: "1px solid #f6e05e", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                    <p style={{ color: "#744210", margin: 0 }}>
                      {result.message}
                    </p>
                  </div>
                )}

                {!result.reussi && result.tentativesRestantes > 0 && (
                  <button onClick={onRetry} style={{ ...btnPrimary, background: "linear-gradient(135deg, #FF8C00, #FFB347)", padding: isMobile ? "0.5rem 1rem" : "0.75rem 1.5rem", fontSize: isMobile ? "0.85rem" : "1rem", border: "none" }}>
                    🔄 Réessayer
                  </button>
                )}
              </>
            )}
          </div>

          {/* CORRECTIONS */}
          {result.detail && result.detail.length > 0 && (
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #FFE0B5", overflow: "hidden" }}>
              <button
                onClick={() => setShowCorrections(!showCorrections)}
                style={{
                  width: "100%",
                  padding: isMobile ? "1rem" : "1.5rem",
                  background: "#FFF8E7",
                  border: "none",
                  borderBottom: "1px solid #FFE0B5",
                  fontSize: isMobile ? "0.9rem" : "1.1rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#FF8C00"
                }}
              >
                <span>📝 {showCorrections ? "Masquer" : "Afficher"} les corrections</span>
                <span style={{ fontSize: "1.3rem" }}>{showCorrections ? "▼" : "▶"}</span>
              </button>

              {showCorrections && (
                <div style={{ padding: isMobile ? "1rem" : "1.5rem" }}>
                  {quiz.questions?.map((q, idx) => {
                    const detail = result.detail?.find((d) => d.questionId === q.id);
                    const isCorrect = detail?.correct;

                    return (
                      <div
                        key={q.id}
                        style={{
                          background: isCorrect ? "#f0fff4" : "#fff5f5",
                          border: `2px solid ${isCorrect ? "#059669" : "#dc2626"}`,
                          borderRadius: "12px",
                          padding: isMobile ? "1rem" : "1.5rem",
                          marginBottom: "1rem"
                        }}
                      >
                        <div style={{ marginBottom: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <span style={{
                              background: isCorrect ? "#059669" : "#dc2626",
                              color: "white",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "20px",
                              fontSize: "0.75rem",
                              fontWeight: "700"
                            }}>
                              {isCorrect ? "✅ CORRECT" : "❌ FAUX"}
                            </span>
                          </div>
                          <h4 style={{ margin: "0.5rem 0", fontSize: isMobile ? "0.9rem" : "1.1rem", color: "#1e293b" }}>
                            Q{idx + 1}. {q.texte}
                          </h4>
                        </div>

                        <div style={{ marginBottom: "1rem", padding: "1rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "0.85rem", color: "#718096", fontWeight: "600", marginBottom: "0.3rem" }}>
                            Votre réponse:
                          </div>
                          <div style={{ fontSize: "0.95rem", color: isCorrect ? "#059669" : "#dc2626", fontWeight: "600" }}>
                            {detail?.repEtudiant || "❌ Aucune réponse"}
                          </div>
                        </div>

                        {!isCorrect && (
                          <div style={{ padding: "1rem", background: "#f0fff4", borderRadius: "8px", border: "1px solid #c6f6d5" }}>
                            <div style={{ fontSize: "0.85rem", color: "#059669", fontWeight: "600", marginBottom: "0.3rem" }}>
                              ✅ Bonne réponse:
                            </div>
                            <div style={{ fontSize: "0.95rem", color: "#059669", fontWeight: "600" }}>
                              {q.reponse}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // QUESTIONS
        <div>
          {error && (
            <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <p style={{ color: "#e53e3e", margin: 0 }}>{error}</p>
            </div>
          )}

          {quiz.questions?.map((q, i) => (
            <div key={q.id} style={{ background: "white", padding: isMobile ? "1rem" : "1.25rem", borderRadius: "10px", marginBottom: "1rem", border: "1px solid #FFE0B5" }}>
              <p style={{ fontWeight: "bold", marginBottom: "1rem", color: "#2d3748", fontSize: isMobile ? "0.9rem" : "1rem" }}>
                Q{i + 1}. {q.texte}
              </p>

              {q.type === "QCM" && q.choix?.map((c, j) => (
                <label key={j} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", marginBottom: "0.4rem", cursor: "pointer", background: answers[q.id] === c ? "#FFE0B5" : "#f7fafc", border: answers[q.id] === c ? "2px solid #FF8C00" : "2px solid transparent", borderRadius: "6px", fontSize: isMobile ? "0.85rem" : "0.95rem" }}>
                  <input type="radio" name={`q-${q.id}`} value={c} checked={answers[q.id] === c} onChange={() => setAnswers({ ...answers, [q.id]: c })} />
                  {c}
                </label>
              ))}

              {q.type === "VRAI_FAUX" && ["Vrai", "Faux"].map((v) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", marginBottom: "0.4rem", cursor: "pointer", background: answers[q.id] === v ? "#FFE0B5" : "#f7fafc", border: answers[q.id] === v ? "2px solid #FF8C00" : "2px solid transparent", borderRadius: "6px", fontSize: isMobile ? "0.85rem" : "0.95rem" }}>
                  <input type="radio" name={`q-${q.id}`} value={v} checked={answers[q.id] === v} onChange={() => setAnswers({ ...answers, [q.id]: v })} />
                  {v}
                </label>
              ))}

              {q.type === "OUVERTE" && (
                <textarea 
                  placeholder="Votre réponse..." 
                  value={answers[q.id] || ""} 
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} 
                  style={{ 
                    width: "100%", 
                    padding: "0.75rem", 
                    border: "1px solid #FFE0B5", 
                    borderRadius: "8px", 
                    height: isMobile ? "80px" : "100px", 
                    resize: "vertical", 
                    boxSizing: "border-box", 
                    fontFamily: "inherit",
                    fontSize: isMobile ? "0.85rem" : "0.95rem"
                  }} 
                />
              )}
            </div>
          ))}

          <button 
            onClick={() => onSubmit(quiz)} 
            disabled={submitting} 
            style={{ 
              ...btnSuccess, 
              background: "linear-gradient(135deg, #FF8C00, #FFB347)",
              width: "100%", 
              padding: isMobile ? "0.75rem" : "1rem", 
              fontSize: isMobile ? "0.9rem" : "1rem", 
              opacity: submitting ? 0.6 : 1,
              border: "none",
              boxShadow: "0 4px 12px rgba(255, 140, 0, 0.3)"
            }}
          >
            {submitting ? "Correction en cours..." : "✅ Soumettre le quiz"}
          </button>
        </div>
      )}
    </div>
  );
}