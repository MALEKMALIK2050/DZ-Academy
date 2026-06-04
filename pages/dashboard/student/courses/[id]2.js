import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ForumEmbed from "@/components/forum/ForumEmbed";
import YouTubePlayer from "@/components/YouTubePlayer";


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

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pretest, setPretest] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [pretestCompleted, setPretestCompleted] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [reponses, setReponses] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCorrections, setShowCorrections] = useState(false);

  // Progress : { [chapterId]: { lu: bool } }
  // QuizStats : { [quizId]: { score, tentatives, reussi, bloque } }
  const [chapterProgress, setChapterProgress] = useState({});
  const [quizStats, setQuizStats] = useState({});

  useEffect(() => {
    if (!id) return;
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Erreur chargement");
      setCourse(data);

                // Vérifier si pretest est complété
          if (data.pretest) {
            setPretest(data.pretest);
            // Chercher si l'élève a un résultat pretest
            const resultRes = await fetch(`/api/pretest/${data.pretest.id}/result?courseId=${data.id}`, { credentials: "include" });
            if (resultRes.ok) {
              const result = await resultRes.json();
              if (result) {
                setPretestCompleted(true);
              }
            }
          }

      // Charger le pretest
      const [pretestCompleted, setPretestCompleted] = useState(false);
      if (data.pretest) {
        setPretest(data.pretest);
        console.log('✅ Pretest chargé:', data.pretest);
      }

      // Charger progression chapitres
      const progRes = await fetch(`/api/student/progress?courseId=${data.id}`, { credentials: "include" });
      const progData = await progRes.json();
      if (progRes.ok) setChapterProgress(progData.chapterProgress || {});

      // Charger stats quiz pour chaque chapitre
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

      // Ouvrir le premier chapitre SEULEMENT après le pretest
          if (data.pretest && !pretestCompleted) {
            // Pretest obligatoire non complété - ne pas ouvrir de chapitre
            setActiveChapter(null);
            console.log("🔒 Pretest obligatoire - chapitre bloqué");
          } else {
            // Pretest complété OU pas de pretest - ouvrir le premier chapitre
            const firstChapter = data.chapters?.[0];
            if (firstChapter) setActiveChapter(firstChapter);
          }

    } catch { setError("Erreur serveur"); }
    finally { setLoading(false); }
  };

  // Vérifier si un chapitre est débloqué
  const isChapterUnlocked = (index) => {
    if (index === 0) return true; // Premier chapitre toujours accessible
    const prevChapter = course?.chapters?.[index - 1];
    if (!prevChapter) return false;

    // Le chapitre précédent doit être lu
    const prevLu = chapterProgress[prevChapter.id]?.lu;
    if (!prevLu) return false;

    // Si le chapitre précédent a un quiz, il doit être réussi à 70 %
    if (prevChapter.quiz) {
      const prevQuizStat = quizStats[prevChapter.quiz.id];
      if (!prevQuizStat?.reussi) return false;
    }

    return true;
  };

  // Vérifier si le test sommatif est débloqué
  const isSommatifUnlocked = () => {
    if (!course?.chapters?.length) return false;
    return course.chapters.every((ch, i) => {
      const lu = chapterProgress[ch.id]?.lu;
      const quizOk = !ch.quiz || quizStats[ch.quiz.id]?.reussi;
      return lu && quizOk;
    });
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
    } catch { }
  };

  const handleSubmitQuiz = async (quiz) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/student/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quizId: quiz.id, reponses }),
      });
      const data = await res.json();

      if (res.ok || res.status === 403) {
        setQuizResult(data);
       // Scroll vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Mettre à jour stats quiz
        setQuizStats((prev) => ({
          ...prev,
          [quiz.id]: {
            score: data.score,
            tentatives: data.tentatives,
            reussi: data.reussi,
            bloque: data.bloque,
          },
        }));
      } else {
        setError(data.error || "Erreur soumission");
      }
    } catch { setError("Erreur serveur"); }
    finally { setSubmitting(false); }
  };

  const handleOpenChapter = (ch, index) => {
    if (!isChapterUnlocked(index)) return;
    setActiveChapter(ch);
    setActiveQuiz(null);
    setQuizResult(null);
    setReponses({});
    setError("");
  };

  const handleOpenSommatif = () => {
    if (!isSommatifUnlocked()) return;
    setActiveChapter(null);
    setActiveQuiz(course.quizFinal);
    setQuizResult(null);
    setReponses({});
    setError("");
  };

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

                        {/* ── Sidebar MODERN ── */}
                        <div style={{ 
                          background: "linear-gradient(135deg, #f0f3f2 0%, #faf9f7 100%)", 
                          padding: "3rem 0.5rem", 
                          overflowY: "auto",
                          minHeight: "calc(300vh - 60px)"
                        }}>

                          {/* HEADER SIDEBAR */}
                          <div style={{
                            background: "rgba(222, 231, 221, 0.1)",
                            backdropFilter: "blur(10px)",
                            padding: "1.5rem",
                            borderRadius: "15px",
                            marginBottom: "2rem",
                            border: "1px solid rgba(86, 155, 101, 0.2)",
                          }}>
                            <div style={{
                              fontSize: "3rem",
                              marginBottom: "1rem",
                            }}>
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

                          {/* PROGRESSION */}
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
                                    <span style={{ background: "rgb(52, 190, 177)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                                      {pct}%
                                    </span>
                                  </div>
                                  <div style={{ 
                                    background: "rgb(52, 190, 177)", 
                                    borderRadius: "12px", 
                                    height: "8px", 
                                    overflow: "hidden",
                                    border: "1px solid rgb(52, 190, 177)",
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

                          {/* CHAPITRES */}
                          <h1 style={{ 
                            color: "rgba(9, 27, 16, 0.7)", 
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
                                        Quiz {quizStats[ch.quiz.id]?.reussi ? "✅" : quizStats[ch.quiz.id]?.bloque ? "⛔" : quizStats[ch.quiz.id]?.tentatives ? `(${quizStats[ch.quiz.id].tentatives}/2)` : ""}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* TEST SOMMATIF */}
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
                                      {quizStats[course.quizFinal.id]?.reussi ? "Réussi ✅" : `${quizStats[course.quizFinal.id].tentatives}/2`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
          {/* ── Contenu principal ── */}
          <div style={{ padding: "2rem", overflowY: "auto" }}>



                          {/* PRETEST COMPLETED - OPTION REFAIRE */}
                          {pretest && (
  <div style={{ 
    background: pretestCompleted ? "#f0fff4" : "#fef3c7",
    border: pretestCompleted ? "2px solid #059669" : "2px solid #f59e0b",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem"
  }}>
    {!pretestCompleted ? (
      /* ── Pretest obligatoire ── */
      <div>
        <h3 style={{ margin: "0 0 1rem", color: "#d97706" }}>
          🎯 Pretest obligatoire avant de commencer
        </h3>
        <p style={{ color: "#92400e", margin: "0 0 1rem" }}>
          Répondez aux questions pour évaluer vos connaissances initiales.
        </p>
        <button
          onClick={() => router.push(`/pretest/${pretest.id}`)}
          style={{
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            color: "white",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "1rem",
          }}
        >
          📝 Commencer le pretest
        </button>
      </div>
    ) : (
      /* ── Pretest complété ── */
      <div>
        <h3 style={{ margin: "0 0 0.5rem", color: "#059669" }}>
          ✅ Pretest complété!
        </h3>
        <p style={{ color: "#047857", margin: "0 0 1rem", fontSize: "0.95rem" }}>
          Vous pouvez maintenant accéder aux chapitres. Vous pouvez aussi refaire le pretest pour voir votre progression.
        </p>
        <button
          onClick={() => router.push(`/pretest/${pretest.id}`)}
          style={{
            background: "linear-gradient(135deg, #059669, #10b981)",
            color: "white",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "1rem",
          }}
        >
          🔄 Refaire le pretest
        </button>
      </div>
    )}
  </div>
)}

            {/* Chapitre actif */}
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

                        // Default for other types (PDF, PPT, etc.)
                        return (
                          
                            <a    key={s.id}
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
                      <p style={{ margin: "0 0 2rem", color: "#011503" }}>
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

                {/* Devoirs */}
                {activeChapter.devoirs?.length > 0 && (
                  <div style={{ marginTop: "3rem" }}>
                    <h2>📋 Devoirs à rendre</h2>
                    {activeChapter.devoirs.map((d) => (
                      <DevoirCard key={d.id} devoir={d} userId={user?.id} />
                    ))}
                  </div>
                )}


                {/* Quiz formatif */}
                {activeChapter.quiz && chapterProgress[activeChapter.id]?.lu && (
                  <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "10px" }}>
                    <h3 style={{ margin: "0 0 0.5rem" }}>📝 Quiz formatif</h3>

                    {quizStats[activeChapter.quiz.id]?.reussi ? (
                      <p style={{ color: "#38a169", margin: 0 }}>
                        ✅ Quiz réussi ({quizStats[activeChapter.quiz.id].score}%) — Chapitre suivant débloqué !
                      </p>
                    ) : (
                      <div>
                        {quizStats[activeChapter.quiz.id]?.tentatives > 0 && (
                          <p style={{ color: "#dd6b20", fontSize: "0.9rem", margin: "0 0 0.75rem" }}>
                            ⚠️ Score précédent : {quizStats[activeChapter.quiz.id].score}% — tentative(s) effectuée(s) : {quizStats[activeChapter.quiz.id].tentatives}
                          </p>
                        )}
                        <p style={{ color: "#718096", fontSize: "0.9rem", margin: "0 0 1rem" }}>
                          Seuil de réussite : {SEUIL}%
                        </p>
                        <button
                          onClick={() => { setActiveQuiz(activeChapter.quiz); setQuizResult(null); setReponses({}); }}
                          style={btnPrimary}>
                          {quizStats[activeChapter.quiz.id]?.tentatives ? "🔄 Réessayer le quiz" : "📝 Passer le quiz"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Message si chapitre pas encore lu */}
                {activeChapter.quiz && !chapterProgress[activeChapter.id]?.lu && (
                  <div style={{ background: "#116e65", border: "1px solid #09523b", padding: "1rem", borderRadius: "8px" }}>
                    <p style={{ margin: 0, color: "#f2f0ee", fontSize: "0.9rem" }}>
                      🔒 Consultez d'abord toutes les ressources et marquez le chapitre comme terminé pour accéder au quiz.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quiz actif */}
            {activeQuiz && (
              <div>
                <h2 style={{ marginTop: 0 }}>
                  📝 {activeQuiz.type === "SOMMATIF" ? "Test sommatif final" : "Quiz formatif"}
                </h2>

                {quizResult ? (
                  /* ── Résultat + Corrections ── */
                  <div>
                    <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
                      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                        {quizResult.reussi ? "🎉" : quizResult.bloque ? "⛔" : "💪"}
                      </div>

                      {quizResult.bloque ? (
                        <>
                          <h2 style={{ color: "#e53e3e" }}>Tentatives épuisées</h2>
                          <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", padding: "1.5rem", borderRadius: "8px", maxWidth: "400px", margin: "0 auto" }}>
                            <p style={{ color: "#742a2a", fontWeight: "bold", margin: 0 }}>
                              📚 Tu devrais étudier ce chapitre à nouveau pour passer. Bon courage! 💪
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <h2 style={{ color: quizResult.reussi ? "#38a169" : "#dd6b20", fontSize: "3rem", margin: "0 0 0.5rem" }}>
                            {quizResult.score}%
                          </h2>
                          <p style={{ color: "#718096", marginBottom: "0.5rem" }}>
                            {quizResult.correct} / {quizResult.total} points
                          </p>
                          <p style={{ color: "#718096", marginBottom: "1.5rem" }}>
                            Tentative {quizResult.tentatives} / 2
                          </p>

                          {quizResult.reussi ? (
                            <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                              <p style={{ color: "#276749", fontWeight: "bold", margin: 0 }}>
                                🎉 Excellent ! {activeQuiz.type === "SOMMATIF" ? "Vous avez validé ce cours !" : "Le chapitre suivant est débloqué !"}
                              </p>
                            </div>
                          ) : (
                            <div style={{ background: "#fffbeb", border: "1px solid #f6e05e", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                              <p style={{ color: "#744210", margin: 0 }}>
                                Score insuffisant — seuil requis : {SEUIL}%<br />
                                Il vous reste {quizResult.tentativesRestantes} tentative(s).
                              </p>
                            </div>
                          )}

                          {!quizResult.reussi && quizResult.tentativesRestantes > 0 && (
                            <button onClick={() => { setQuizResult(null); setReponses({}); }} style={btnPrimary}>
                              🔄 Réessayer
                            </button>
                          )}

                          {quizResult.reussi && (
                            <button onClick={() => { setActiveQuiz(null); setActiveChapter(course?.chapters?.[0]); fetchCourse(); }} style={btnSuccess}>
                              Continuer →
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* CORRECTIONS */}
                    {quizResult.detail && quizResult.detail.length > 0 && (
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
                            {activeQuiz.questions?.map((q, idx) => {
                              const detail = quizResult.detail?.find((d) => d.questionId === q.id);
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
                                  {/* Question */}
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
                                      <span style={{ color: "#718096", fontSize: "0.9rem" }}>
                                        {q.points} pt(s)
                                      </span>
                                    </div>
                                    <h4 style={{ margin: "0.5rem 0", fontSize: "1.1rem", color: "#1e293b" }}>
                                      Q{idx + 1}. {q.texte}
                                    </h4>
                                  </div>

                                  {/* Réponse étudiant */}
                                  <div style={{ marginBottom: "1rem", padding: "1rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.9rem", color: "#718096", fontWeight: "600", marginBottom: "0.3rem" }}>
                                      Votre réponse:
                                    </div>
                                    <div style={{ fontSize: "1rem", color: isCorrect ? "#059669" : "#dc2626", fontWeight: "600" }}>
                                      {detail?.repEtudiant || "❌ Aucune réponse"}
                                    </div>
                                  </div>

                                  {/* Bonne réponse */}
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
                  /* ── Questions ── */
                  <div>
                    {error && (
                      <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                        <p style={{ color: "#e53e3e", margin: 0 }}>{error}</p>
                      </div>
                    )}

                    <div style={{ background: "#fffbeb", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.9rem", color: "#744210" }}>
                      ⚠️ Seuil de réussite : {SEUIL}% — {2 - (quizStats[activeQuiz.id]?.tentatives || 0)} tentative(s) disponible(s)
                    </div>

                    {activeQuiz.questions?.map((q, i) => (
                      <div key={q.id} style={{ background: "white", padding: "1.25rem", borderRadius: "10px", marginBottom: "1rem", border: "1px solid #e2e8f0" }}>
                        <p style={{ fontWeight: "bold", marginBottom: "1rem", color: "#2d3748" }}>
                          Q{i + 1} : {q.texte}
                          <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#a0aec0", fontWeight: "normal" }}>
                            ({q.points} pt{q.points > 1 ? "s" : ""})
                          </span>
                        </p>

                        {/* QCM */}
                        {q.type === "QCM" && q.choix.map((c, j) => (
                          <label key={j} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "6px", marginBottom: "0.4rem", cursor: "pointer", background: reponses[q.id] === c ? "#ebf8ff" : "#f7fafc", border: reponses[q.id] === c ? "2px solid #3182ce" : "2px solid transparent" }}>
                            <input type="radio" name={`q-${q.id}`} value={c} checked={reponses[q.id] === c} onChange={() => setReponses({ ...reponses, [q.id]: c })} />
                            {c}
                          </label>
                        ))}

                        {/* QCM Multiple */}
                        {q.type === "QCM_MULTIPLE" && q.choix.map((c, j) => (
                          <label key={j} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "6px", marginBottom: "0.4rem", cursor: "pointer", background: Array.isArray(reponses[q.id]) && reponses[q.id].includes(c) ? "#ebf8ff" : "#f7fafc", border: Array.isArray(reponses[q.id]) && reponses[q.id].includes(c) ? "2px solid #3182ce" : "2px solid transparent" }}>
                            <input type="checkbox" value={c}
                              checked={Array.isArray(reponses[q.id]) && reponses[q.id].includes(c)}
                              onChange={(e) => {
                                const prev = Array.isArray(reponses[q.id]) ? reponses[q.id] : [];
                                const next = e.target.checked ? [...prev, c] : prev.filter((x) => x !== c);
                                setReponses({ ...reponses, [q.id]: next });
                              }}
                            />
                            {c}
                          </label>
                        ))}

                        {/* Vrai/Faux */}
                        {q.type === "VRAI_FAUX" && ["Vrai", "Faux"].map((v) => (
                          <label key={v} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "6px", marginBottom: "0.4rem", cursor: "pointer", background: reponses[q.id] === v ? "#ebf8ff" : "#f7fafc", border: reponses[q.id] === v ? "2px solid #3182ce" : "2px solid transparent" }}>
                            <input type="radio" name={`q-${q.id}`} value={v} checked={reponses[q.id] === v} onChange={() => setReponses({ ...reponses, [q.id]: v })} />
                            {v}
                          </label>
                        ))}

                        {/* Ouverte */}
                        {q.type === "OUVERTE" && (
                          <textarea placeholder="Votre réponse..." value={reponses[q.id] || ""}
                            onChange={(e) => setReponses({ ...reponses, [q.id]: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px", height: "100px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                          />
                        )}

                        {/* GAP */}
                        {q.type === "GAP" && (() => {
                          const parts = q.texte.split(/\[trou\]/gi);
                          return (
                            <div style={{ lineHeight: "2.2", fontSize: "1rem", color: "#2d3748" }}>
                              {parts.map((part, pi) => (
                                <span key={pi}>
                                  {part}
                                  {pi < parts.length - 1 && (
                                    <input
                                      placeholder={`trou ${pi + 1}`}
                                      value={(reponses[q.id] || [])[pi] || ""}
                                      onChange={(e) => {
                                        const prev = Array.isArray(reponses[q.id]) ? [...reponses[q.id]] : [];
                                        prev[pi] = e.target.value;
                                        setReponses({ ...reponses, [q.id]: prev });
                                      }}
                                      style={{ display: "inline-block", width: "120px", padding: "0.2rem 0.5rem", border: "none", borderBottom: "2px solid #3182ce", background: "#ebf8ff", borderRadius: "4px", margin: "0 0.25rem", fontSize: "1rem", textAlign: "center" }}
                                    />
                                  )}
                                </span>
                              ))}
                            </div>
                          );
                        })()}

                        {/* MATCHING */}
                        {q.type === "MATCHING" && (() => {
                          let droites = [];
                          try { droites = Object.values(JSON.parse(q.reponse || "{}")); } catch {}
                          // Mélanger une seule fois par question (stable via useMemo-like trick avec sort fixe)
                          const shuffled = [...droites].sort((a, b) => (q.id + a).localeCompare(q.id + b));
                          return (
                            <div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <strong style={{ color: "#4a5568", fontSize: "0.85rem" }}>Éléments</strong>
                                <strong style={{ color: "#4a5568", fontSize: "0.85rem" }}>Correspondances</strong>
                              </div>
                              {q.choix.map((gauche, gi) => (
                                <div key={gi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                                  <span style={{ background: "#edf2f7", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>{gauche}</span>
                                  <select
                                    value={(reponses[q.id] || {})[gauche] || ""}
                                    onChange={(e) => setReponses({ ...reponses, [q.id]: { ...(reponses[q.id] || {}), [gauche]: e.target.value } })}
                                    style={{ padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "6px", background: "white" }}
                                  >
                                    <option value="">— Choisir —</option>
                                    {shuffled.map((d, di) => (
                                      <option key={di} value={d}>{d}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* ORDERING */}
                        {q.type === "ORDERING" && (
                          <div>
                            <p style={{ color: "#718096", fontSize: "0.85rem" }}>Numérotez dans le bon ordre :</p>
                            {q.choix.map((elem, ei) => (
                              <div key={ei} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                <input type="number" min="1" max={q.choix.length} placeholder="#"
                                  style={{ width: "60px", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "6px", textAlign: "center" }}
                                  onChange={(e) => {
                                    const prev = Array.isArray(reponses[q.id]) ? [...reponses[q.id]] : new Array(q.choix.length).fill("");
                                    prev[parseInt(e.target.value) - 1] = elem;
                                    setReponses({ ...reponses, [q.id]: prev });
                                  }}
                                />
                                <span style={{ background: "#edf2f7", padding: "0.5rem 1rem", borderRadius: "6px", flex: 1 }}>{elem}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <button onClick={() => handleSubmitQuiz(activeQuiz)} disabled={submitting} style={{ ...btnSuccess, width: "100%", padding: "1rem", fontSize: "1rem" }}>
                      {submitting ? "Correction en cours..." : "✅ Soumettre le quiz"}
                    </button>
                  </div>
                )}
              </div>
            )}

                        {/* Message d'accueil */}
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

    setUploading(true); setError(""); setSuccess("");

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
  // Attendre 1s puis fermer le message
  setTimeout(() => {
    setSuccess("");
  }, 2000);
}

   else {
        setError(data.error || "Erreur dépôt");
      }
    } catch { setError("Erreur serveur"); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ background: "white", border: `1.5px solid ${depasse ? "#e53e3e" : "#c62017"}`, padding: "1.6rem", borderRadius: "10px", marginBottom: "4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h5 style={{ margin: 0 }}>📋 {devoir.titre}</h5>
        <span style={{ background: depasse ? "#105907" : "#ed9238", color: "white", padding: "0.8rem 0.8rem", borderRadius: "10px", fontSize: "0.8rem" }}>
          {depasse ? "⛔ Clôturé" : `⏰ ${deadline.toLocaleDateString("fr-FR")}`}
        </span>
      </div>

      {/* Consigne */}
      <div
        style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#f7fafc", borderRadius: "6px", fontSize: "0.9rem", lineHeight: "1.6" }}
        dangerouslySetInnerHTML={{ __html: devoir.consigne }}
      />

      {/* Rendu existant */}
      {monRendu && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f0fff4", borderRadius: "6px", border: "1px solid #9ae6b4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ background: monRendu.fichierType === "PDF" ? "#e53e3e" : monRendu.fichierType === "WORD" ? "#3182ce" : "#38a169", color: "white", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem" }}>
              {monRendu.fichierType}
            </span>
            <span style={{ flex: 1, fontSize: "0.9rem", color: "#276749" }}>✅ {monRendu.fichierNom}</span>
            <a href={monRendu.fichierUrl} target="_blank" rel="noreferrer" style={{ color: "#3182ce", fontSize: "0.85rem" }}>
              👁 Voir
            </a>
          </div>
          {monRendu.note !== null && monRendu.note !== undefined && (
            <div style={{ marginTop: "0.5rem", fontWeight: "bold", color: monRendu.note >= 10 ? "#38a169" : "#e53e3e" }}>
              Note : {monRendu.note}/20
              {monRendu.feedback && <div style={{ fontWeight: "normal", color: "#4a5568", marginTop: "0.25rem" }}>💬 {monRendu.feedback}</div>}
            </div>
          )}
        </div>
      )}

      {/* Zone dépôt */}
      {!depasse ? (
        <div style={{ marginTop: "1rem" }}>
          {error && <p style={{ color: "red", background: "#fff5f5", padding: "0.5rem", borderRadius: "6px", fontSize: "0.85rem" }}>{error}</p>}
          {success && <p style={{ color: "green", background: "#f0fff4", padding: "0.5rem", borderRadius: "6px", fontSize: "0.85rem" }}>{success}</p>}

          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" style={{ display: "none" }} onChange={handleUpload} />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ background: monRendu ? "#805ad5" : "#055b2d", color: "white", padding: "0.6rem 1.2rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
            {uploading ? "Dépôt en cours..." : monRendu ? "🔄 Remplacer mon rendu" : "📤 Déposer mon travail"}
          </button>
          <div style={{ fontSize: "0.8rem", color: "#718096", marginTop: "0.4rem" }}>
            Formats acceptés : PDF, Word, Images — Max 20MB
          </div>
        </div>
      ) : (
        !monRendu && (
          <div style={{ marginTop: "1rem", background: "#fff5f5", padding: "0.75rem", borderRadius: "6px" }}>
            <p style={{ color: "#e53e3e", margin: 0, fontSize: "0.9rem" }}>
              ⛔ La date limite est dépassée — dépôt impossible.
            </p>
          </div>
        )
      )}
    </div>
  );
}