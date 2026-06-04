import { useEffect, useState, useRef } from "react";
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
    // Pretest obligatoire: tous les chapitres bloqués tant qu'il n'est pas complété
    if (pretest && !pretestCompleted) {
      return false;
    }

    if (index === 0) return true;

    const prevChapter = course?.chapters?.[index - 1];
    if (!prevChapter) return false;

    // Le chapitre précédent doit être lu
    const prevLu = chapterProgress[prevChapter.id]?.lu;
    if (!prevLu) return false;

    // Si le chapitre précédent a un quiz, il doit être réussi
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

        // Afficher automatiquement les corrections si score insuffisant
        if (!data.reussi) setShowCorrections(true);

        // Mettre à jour les stats
        setQuizStats((prev) => ({
          ...prev,
          [quiz.id]: {
            score: data.score,
            tentatives: data.tentatives,
            reussi: data.reussi,
            bloque: data.bloque,
          },
        }));

        // Si réussi, recharger le cours pour déverrouiller le chapitre suivant
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

  // ====== RENDER ======
  if (loading) return <p style={{ padding: "2rem" }}>Chargement...</p>;
  if (error && !course) return <p style={{ color: "red", padding: "2rem" }}>{error}</p>;

  const sommatifUnlocked = isSommatifUnlocked();

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

        {/* Header cours */}
        <div style={{ background: "#f36528", color: "white", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "10rem" }}>
          <button onClick={() => router.push("/dashboard/student")} style={{ background: "none", border: "none", color: "#eef2f7", cursor: "pointer", fontSize: "1.3rem" }}>
            ← Retour
          </button>
          <div>
            <h1 style={{ margin: 0.9, fontSize: "1.9rem" }}>{course?.title}</h1>
            <p style={{ margin: 0.9, fontSize: "1.5rem", color: "#1ed83a" }}>
              {[course?.matiere, course?.niveau, course?.annee].filter(Boolean).join(" • ")}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "450px 1fr", minHeight: "calc(100vh - 60px)" }}>

          {/* ── SIDEBAR ── */}
          <div style={{
            background: "linear-gradient(135deg, #f0f3f2 0%, #faf9f7 100%)",
            padding: "3rem 0.5rem",
            overflowY: "auto",
            minHeight: "calc(300vh - 60px)"
          }}>

            {/* Header Sidebar */}
            <div style={{
              background: "rgba(222, 231, 221, 0.1)",
              backdropFilter: "blur(10px)",
              padding: "1.5rem",
              borderRadius: "15px",
              marginBottom: "2rem",
              border: "1px solid rgba(86, 155, 101, 0.2)",
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                {pretestCompleted ? "🚀" : "🎯"}
              </div>
              <h3 style={{
                margin: "0 0 0.5rem",
                color: "green",
                fontSize: "1.25rem",
                fontWeight: "1500",
              }}>
                {pretestCompleted ? "Prêt à apprendre!" : "Évalue-toi d'abord"}
              </h3>
              <p style={{
                margin: 0,
                color: "rgba(2, 60, 56, 0.8)",
                fontSize: "0.90rem",
                lineHeight: "1.9",
              }}>
                {pretestCompleted
                  ? "Tu as les bases. Explore les chapitres!"
                  : "Le pretest t'aidera à vérifier tes connaissances."}
              </p>
            </div>

            {/* Progression */}
            <div style={{ marginBottom: "2rem" }}>
              {(() => {
                const total = course?.chapters?.length || 0;
                const done = course?.chapters?.filter((ch) => chapterProgress[ch.id]?.lu && (!ch.quiz || quizStats[ch.quiz.id]?.reussi)).length || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "rgba(4, 53, 26, 0.9)",
                      fontSize: "1rem",
                      marginBottom: "1.5rem",
                      fontWeight: "600",
                    }}>
                      <span>Progression</span>
                      <span style={{ background: "rgb(82, 237, 224)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{
                      background: "rgb(214, 226, 224)",
                      borderRadius: "12px",
                      height: "8px",
                      overflow: "hidden",
                      border: "1px solid rgb(13, 69, 65)",
                    }}>
                      <div style={{
                        background: "linear-gradient(150deg, #2ded74, #22c55e)",
                        width: `${pct}%`,
                        height: "100%",
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Chapitres */}
            <h1 style={{
              color: "rgba(13, 28, 18, 0.7)",
              fontSize: "1.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              marginBottom: "1rem",
              fontWeight: "700",
            }}>
              📖 Chapitres :
            </h1>

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
                      padding: "1rem",
                      borderRadius: "12px",
                      cursor: unlocked ? "pointer" : "not-allowed",
                      background: active
                        ? "rgba(15, 31, 20, 0.33)"
                        : completed
                        ? "rgba(152, 225, 178, 0.2)"
                        : unlocked
                        ? "rgba(158, 224, 181, 0.1)"
                        : "rgba(7, 18, 13, 0.2)",
                      color: unlocked ? "white" : "rgba(179, 239, 199, 0.5)",
                      opacity: unlocked ? 1 : 0.6,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      border: active ? "3px solid rgba(16, 229, 58, 0.41)" : "2px solid transparent",
                      transition: "all 0.2s ease",
                      backdropFilter: "blur(10px)",
                    }}>
                    <span style={{ fontSize: "1.3rem" }}>
                      {!unlocked ? "🔒" : completed ? "✨" : bloque ? "⚠️" : "📚"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "1.3rem",
                        fontWeight: active ? "700" : "600",
                        color: "rgba(2, 60, 56, 0.8)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {i + 1}. {ch.title}
                      </div>
                      {ch.quiz && unlocked && (
                        <div style={{
                          fontSize: "0.7rem",
                          color: "rgba(23, 3, 3, 0.7)",
                          marginTop: "0.2rem",
                        }}>
                          Quiz {quizStats[ch.quiz.id]?.reussi ? "✅" : quizStats[ch.quiz.id]?.bloque ? "⛔" : quizStats[ch.quiz.id]?.tentatives ? `(${quizStats[ch.quiz.id].tentatives}/3)` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Test Sommatif */}
            {course?.quizFinal && (
              <div style={{ marginTop: "2rem" }}>
                <h3 style={{
                  color: "rgba(11, 7, 1, 0.7)",
                  fontSize: "1rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5em",
                  fontWeight: "700",
                  marginBottom: "1.5rem",
                }}>
                  🏆 Final 🏆
                </h3>
                <div
                  onClick={handleOpenSommatif}
                  style={{
                    padding: "1rem",
                    borderRadius: "20px",
                    marginTop: "2rem",
                    cursor: sommatifUnlocked ? "pointer" : "not-allowed",
                    background: activeQuiz?.id === course.quizFinal.id
                      ? "rgba(181, 171, 171, 0.25)"
                      : sommatifUnlocked
                      ? "rgba(220, 132, 24, 0.2)"
                      : "rgba(0,0,0,0.2)",
                    color: sommatifUnlocked ? "white" : "rgba(11, 87, 85, 0.5)",
                    opacity: sommatifUnlocked ? 1 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "9rem",
                    border: activeQuiz?.id === course.quizFinal.id ? "2px solid rgba(255,255,255,0.4)" : "2px solid transparent",
                    transition: "all 0.2s ease",
                    backdropFilter: "blur(10px)",
                  }}>
                  <span style={{ fontSize: "2rem" }}>
                    {!sommatifUnlocked ? "🔒" : quizStats[course.quizFinal.id]?.reussi ? "🏆" : "📝"}
                  </span>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "1.5rem", color: "green" }}>
                      Test Final
                    </div>
                    {sommatifUnlocked && quizStats[course.quizFinal.id]?.tentatives && (
                      <div style={{ fontSize: "0.7rem", color: "rgba(178, 23, 23, 0.7)" }}>
                        {quizStats[course.quizFinal.id]?.reussi ? "Réussi ✅" : `${quizStats[course.quizFinal.id].tentatives}/3`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── CONTENU PRINCIPAL ── */}
          <div style={{ padding: "2rem", overflowY: "auto" }}>

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
                padding: "1.5rem",
                borderRadius: "12px",
                marginBottom: "1.5rem"
              }}>
                <h3 style={{ margin: "0 0 0.5rem", color: pretestFeedback?.color === 'red' ? '#c53030' : pretestFeedback?.color === 'yellow' ? '#b7791f' : '#059669' }}>
                  {pretestFeedback?.level === 'critique' ? '⚠️ Attention !' : '✅ Pretest complété!'}
                </h3>
                {pretestFeedback && (
                  <div style={{ marginBottom: "1rem", fontSize: "1.1rem", fontWeight: "600", color: "#2d3748", padding: "0.75rem", background: "white", borderRadius: "8px", border: "1px dashed #cbd5e0" }}>
                    {pretestFeedback.message}
                  </div>
                )}
                <p style={{ color: "#4a5568", margin: "0 0 1rem", fontSize: "0.95rem" }}>
                  {pretestFeedback?.level === 'critique' 
                    ? "Nous vous conseillons de revoir les bases avant d'attaquer ce cours. N'hésitez pas à refaire le pretest."
                    : "Vous pouvez maintenant accéder aux chapitres. Vous pouvez refaire le pretest pour suivre votre progression."}
                </p>
                <button
                  onClick={() => {
                    setPretestCompleted(false);
                    setPretestAnswers({});
                    setPretestFeedback(null);
                  }}
                  style={btnPrimary}
                >
                  🔄 Refaire le pretest
                </button>
              </div>
            )}

            {/* CHAPITRE ACTIF */}
            {activeChapter && !activeQuiz && (
              <div>
                <h2 style={{ marginTop: 0 }}>{activeChapter.title}</h2>

                {activeChapter.objectifs && (
                  <div style={{ background: "#42be63", border: "1px solid #9ae6b4", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                    🎯 <strong>Objectifs :</strong> {activeChapter.objectifs}
                  </div>
                )}

                {/* Supports */}
                {activeChapter.supports?.length > 0 && (
                  <div style={{ marginBottom: "3rem" }}>
                    <div style={{ display: "grid", gap: "2rem" }}>
                      {activeChapter.supports.map((s) => {
                        if (s.type === "TEXTE") {
                          return (
                            <div key={s.id} style={{ background: "white", border: "1px solid #13a74b", padding: "2rem", borderRadius: "10px" }}>
                              {s.nom && (
                                <h2 style={{ margin: "0 0 3rem", color: "#0b5f0a", borderBottom: "2px solid #bed2ed", paddingBottom: "0.5rem" }}>
                                  {s.nom}
                                </h2>
                              )}
                              <div
                                dangerouslySetInnerHTML={{ __html: s.contenu }}
                                style={{ lineHeight: "1.6", color: "#012720af" }}
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
                              border: "1px solid #e2e8f0",
                              padding: "1rem",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              textDecoration: "none",
                              color: "#2d3748"
                            }}
                          >
                            <span style={{ background: typeColor(s.type), color: "white", padding: "0.3rem 0.8rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold" }}>
                              {s.type}
                            </span>
                            <span style={{ color: "#3182ce", fontWeight: "500" }}>{s.nom || s.url}</span>
                            <span style={{ marginLeft: "auto", color: "#a0aec0" }}>→</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Marquer comme lu */}
                <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
                  {!chapterProgress[activeChapter.id]?.lu ? (
                    <div>
                      <p style={{ margin: "0 0 1rem", color: "#011503" }}>
                        <h3>Avez-vous consulté toutes les ressources de ce chapitre ?</h3>
                      </p>
                      <button onClick={() => handleMarkRead(activeChapter.id)} style={btnSuccess}>
                        ✅ J'ai terminé ce chapitre
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "#291b0a", fontWeight: "bold" }}>
                      ✅ Chapitre consulté
                    </p>
                  )}
                </div>

                {/* Quiz formatif */}
                {activeChapter.quiz && chapterProgress[activeChapter.id]?.lu && (
                  <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "10px" }}>
                    <h3 style={{ margin: "0 0 0.5rem" }}>📝 Quiz formatif</h3>

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
                          style={btnPrimary}
                        >
                          {quizStats[activeChapter.quiz.id]?.tentatives ? "🔄 Réessayer" : "📝 Passer le quiz"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeChapter.quiz && !chapterProgress[activeChapter.id]?.lu && (
                  <div style={{ background: "#116e65", border: "1px solid #09523b", padding: "1rem", borderRadius: "8px" }}>
                    <p style={{ margin: 0, color: "#f2f0ee", fontSize: "0.9rem" }}>
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
              <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#718096" }}>
                {pretestCompleted ? (
                  <>
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📚</div>
                    <h2>Bienvenue dans ce cours !</h2>
                    <p>Sélectionnez un chapitre dans le menu de gauche pour commencer.</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎯</div>
                    <h2>Avant de commencer...</h2>
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
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>
        📝 {quiz.type === "SOMMATIF" ? "Test sommatif final" : "Quiz formatif"}
      </h2>

      {result ? (
        // RÉSULTAT
        <div>
          <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
              {result.reussi ? "🎉" : result.bloque ? "⛔" : "💪"}
            </div>

            {result.bloque ? (
              <>
                <h2 style={{ color: "#e53e3e" }}>Tentatives épuisées</h2>
                <div style={{ background: "#fff5f5", border: "1.5px solid #feb2b2", padding: "1.5rem", borderRadius: "8px", maxWidth: "560px", margin: "0 auto" }}>
                  <p style={{ color: "#742a2a", fontWeight: "700", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    ⛔ Vous avez utilisé vos 3 tentatives sans atteindre le score requis (90%).
                  </p>
                  <p style={{ color: "#9b2c2c", fontSize: "0.9rem", fontStyle: "italic", margin: "0 0 1rem" }}>
                    🔒 Le chapitre suivant restera verrouillé jusqu'au déblocage par votre enseignant.
                  </p>
                  <RemediationRequest quiz={quiz} quizResult={result} score={result.score} />
                </div>
              </>
            ) : (
              <>
                <h2 style={{ color: result.reussi ? "#38a169" : "#dd6b20", fontSize: "3rem", margin: "0 0 0.5rem" }}>
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
                      <button onClick={onNextChapter} style={{ background: "#059669", color: "white", padding: "0.75rem 1.5rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "700" }}>
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
                  <button onClick={onRetry} style={btnPrimary}>
                    🔄 Réessayer
                  </button>
                )}
              </>
            )}
          </div>

          {/* CORRECTIONS */}
          {result.detail && result.detail.length > 0 && (
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <button
                onClick={() => setShowCorrections(!showCorrections)}
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  background: "#f8fafc",
                  border: "none",
                  borderBottom: "1px solid #edf2f7",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#1e293b"
                }}
              >
                <span>📝 {showCorrections ? "Masquer" : "Afficher"} les corrections</span>
                <span style={{ fontSize: "1.3rem" }}>{showCorrections ? "▼" : "▶"}</span>
              </button>

              {showCorrections && (
                <div style={{ padding: "1.5rem" }}>
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
                          padding: "1.5rem",
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
                          <h4 style={{ margin: "0.5rem 0", fontSize: "1.1rem", color: "#1e293b" }}>
                            Q{idx + 1}. {q.texte}
                          </h4>
                        </div>

                        <div style={{ marginBottom: "1rem", padding: "1rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "0.9rem", color: "#718096", fontWeight: "600", marginBottom: "0.3rem" }}>
                            Votre réponse:
                          </div>
                          <div style={{ fontSize: "1rem", color: isCorrect ? "#059669" : "#dc2626", fontWeight: "600" }}>
                            {detail?.repEtudiant || "❌ Aucune réponse"}
                          </div>
                        </div>

                        {!isCorrect && (
                          <div style={{ padding: "1rem", background: "#f0fff4", borderRadius: "8px", border: "1px solid #c6f6d5" }}>
                            <div style={{ fontSize: "0.9rem", color: "#059669", fontWeight: "600", marginBottom: "0.3rem" }}>
                              ✅ Bonne réponse:
                            </div>
                            <div style={{ fontSize: "1rem", color: "#059669", fontWeight: "600" }}>
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
            <div key={q.id} style={{ background: "white", padding: "1.25rem", borderRadius: "10px", marginBottom: "1rem", border: "1px solid #e2e8f0" }}>
              <p style={{ fontWeight: "bold", marginBottom: "1rem", color: "#2d3748" }}>
                Q{i + 1}. {q.texte}
              </p>

              {q.type === "QCM" && q.choix?.map((c, j) => (
                <label key={j} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", marginBottom: "0.4rem", cursor: "pointer", background: answers[q.id] === c ? "#ebf8ff" : "#f7fafc", border: answers[q.id] === c ? "2px solid #3182ce" : "2px solid transparent", borderRadius: "6px" }}>
                  <input type="radio" name={`q-${q.id}`} value={c} checked={answers[q.id] === c} onChange={() => setAnswers({ ...answers, [q.id]: c })} />
                  {c}
                </label>
              ))}

              {q.type === "VRAI_FAUX" && ["Vrai", "Faux"].map((v) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", marginBottom: "0.4rem", cursor: "pointer", background: answers[q.id] === v ? "#ebf8ff" : "#f7fafc", border: answers[q.id] === v ? "2px solid #3182ce" : "2px solid transparent", borderRadius: "6px" }}>
                  <input type="radio" name={`q-${q.id}`} value={v} checked={answers[q.id] === v} onChange={() => setAnswers({ ...answers, [q.id]: v })} />
                  {v}
                </label>
              ))}

              {q.type === "OUVERTE" && (
                <textarea placeholder="Votre réponse..." value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} style={{ width: "100%", padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", height: "100px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
              )}
            </div>
          ))}

          <button onClick={() => onSubmit(quiz)} disabled={submitting} style={{ ...btnSuccess, width: "100%", padding: "1rem", fontSize: "1rem", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Correction en cours..." : "✅ Soumettre le quiz"}
          </button>
        </div>
      )}
    </div>
  );
}

function DevoirCard({ devoir, userId }) {
  const deadline = new Date(devoir.dateLimit);
  const depasse = new Date() > deadline;
  const monRendu = devoir.rendus?.find((r) => r.studentId === userId);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("fichier", file);
    formData.append("devoirId", devoir.id);

    try {
      const res = await fetch("/api/devoirs/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Fichier déposé avec succès !");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(data.error || "Erreur dépôt");
      }
    } catch (e) {
      console.error("Erreur:", e);
      setError("Erreur serveur");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: "white", border: `1.5px solid ${depasse ? "#e53e3e" : "#c62017"}`, padding: "1.6rem", borderRadius: "10px", marginBottom: "4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h5 style={{ margin: 0 }}>📋 {devoir.titre}</h5>
        <span style={{ background: depasse ? "#105907" : "#ed9238", color: "white", padding: "0.8rem 0.8rem", borderRadius: "10px", fontSize: "0.8rem" }}>
          {depasse ? "⛔ Clôturé" : `⏰ ${deadline.toLocaleDateString("fr-FR")}`}
        </span>
      </div>

      <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#f7fafc", borderRadius: "6px", fontSize: "0.9rem", lineHeight: "1.6" }} dangerouslySetInnerHTML={{ __html: devoir.consigne }} />

      {monRendu && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f0fff4", borderRadius: "6px", border: "1px solid #9ae6b4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ background: "#38a169", color: "white", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem" }}>
              ✅ Rendu
            </span>
            <span style={{ flex: 1, fontSize: "0.9rem", color: "#276749" }}>{monRendu.fichierNom}</span>
            <a href={monRendu.fichierUrl} target="_blank" rel="noreferrer" style={{ color: "#3182ce", fontSize: "0.85rem" }}>
              👁 Voir
            </a>
          </div>
          {monRendu.note !== null && (
            <div style={{ marginTop: "0.5rem", fontWeight: "bold", color: monRendu.note >= 10 ? "#38a169" : "#e53e3e" }}>
              Note : {monRendu.note}/20
            </div>
          )}
        </div>
      )}

      {!depasse ? (
        <div style={{ marginTop: "1rem" }}>
          {error && <p style={{ color: "red", fontSize: "0.85rem" }}>{error}</p>}
          {success && <p style={{ color: "green", fontSize: "0.85rem" }}>{success}</p>}
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ background: monRendu ? "#805ad5" : "#055b2d", color: "white", padding: "0.6rem 1.2rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
            {uploading ? "Dépôt..." : monRendu ? "🔄 Remplacer" : "📤 Déposer"}
          </button>
        </div>
      ) : !monRendu && (
        <div style={{ marginTop: "1rem", background: "#fff5f5", padding: "0.75rem", borderRadius: "6px" }}>
          <p style={{ color: "#e53e3e", margin: 0, fontSize: "0.9rem" }}>
            ⛔ Délai dépassé
          </p>
        </div>
        
      )}
      {course?.quizFinal && (
  <button
    onClick={() => router.push(`/dashboard/student/courses/${id}/final-exam`)}
    style={{
      padding: "0.75rem 1.5rem",
      background: "linear-gradient(135deg, #dc2626, #ef4444)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      fontWeight: "700",
    }}
  >
    🏁 Test Final (75% requis)
  </button>
)}
    </div>
  );
}

