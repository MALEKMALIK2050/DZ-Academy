"use client";
import { useEffect, useState } from "react";

import { MATIERES, getMatiereLabel, getNiveauLabel, getMatiereStyles, getSubjectIcon, getSubjectDecorations } from "@/lib/constants";

export default function StudentCoursesPage() {
  const [data, setData]       = useState({ catalogue: [], enrollments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [sending, setSending] = useState({}); // courseId en cours

  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [filtreAnnee, setFiltreAnnee] = useState("");
  const [filtreMatiere, setFiltreMatiere] = useState("");

  const fetchCourses = (niv = "", ann = "", mat = "") => {
    setLoading(true);
    const params = new URLSearchParams();
    if (niv) params.append("niveau", niv);
    if (ann) params.append("annee", ann);
    if (mat) params.append("matiere", mat);

    fetch(`/api/student/courses?${params.toString()}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("تعذّر تحميل الدورات");
        return res.json();
      })
      .then((data) => { setData(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { fetchCourses(filtreNiveau, filtreAnnee, filtreMatiere); }, []);

  const ANNEES_COLLEGE = ['1AM', '2AM', '3AM', '4AM'];
  const ANNEES_LYCEE = ['1AS', '2AS', '3AS'];
  const anneesDisponibles = filtreNiveau === 'college' ? ANNEES_COLLEGE : filtreNiveau === 'lycee' ? ANNEES_LYCEE : [];

  const handleDemande = async (courseId) => {
    setSending((p) => ({ ...p, [courseId]: true }));
    try {
      const res = await fetch("/api/student/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, typePaiement: "COURS_SEUL" }),
      });
      if (res.ok) {
        // Notifier l'admin
        await fetch("/api/notifications/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ courseId, type: "DEMANDE_INSCRIPTION" }),
        });
        fetchCourses(); // Recharger pour mettre à jour le statut
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending((p) => ({ ...p, [courseId]: false }));
    }
  };

  // Trouver le statut d'inscription pour un cours
  const getEnrollment = (courseId) =>
    data.catalogue
      .find((c) => c.id === courseId)
      ?.enrollments?.[0] || null;

  const btnStatut = (enrollment, courseId) => {
    if (!enrollment) {
      return (
        <button
          onClick={() => handleDemande(courseId)}
          disabled={sending[courseId]}
          className="btn-dent-blue"
          style={{
            marginTop: "0.75rem",
            width: "100%",
            padding: "0.65rem",
            fontSize: "0.9rem",
            opacity: sending[courseId] ? 0.7 : 1,
          }}
        >
          {sending[courseId] ? "⏳ جارٍ الإرسال..." : "📩 طلب الوصول"}
        </button>
      );
    }

    const colors = {
      EN_ATTENTE: { bg: "#fffff0", color: "#b7791f", label: "⏳ في انتظار الموافقة" },
      VALIDE:     { bg: "#f0fff4", color: "#276749", label: "✅ تم قبول الوصول" },
      REJETE:     { bg: "#fff5f5", color: "#c53030", label: "❌ تم رفض الطلب" },
    };
    const cfg = colors[enrollment.statut] || colors.EN_ATTENTE;

    return (
      <div style={{
        marginTop: "0.75rem",
        padding: "0.5rem 0.75rem",
        background: cfg.bg,
        color: cfg.color,
        borderRadius: "8px",
        fontWeight: "700",
        fontSize: "0.85rem",
        textAlign: "center",
      }}>
        {cfg.label}
      </div>
    );
  };

  return (
    <div dir="rtl" lang="ar" style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#2d3748", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        📚 الكتالوج والتسجيلات
      </h1>

      {loading && <p style={{ color: "#718096" }}>جارٍ التحميل...</p>}
      {error   && <p style={{ color: "#e53e3e", background: "#fff5f5", padding: "1rem", borderRadius: "8px" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

          {/* Mes inscriptions */}
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#4a5568", marginBottom: "1rem" }}>
              📋 تسجيلاتي ({data.enrollments?.length || 0})
            </h2>
            {data.enrollments?.length === 0 ? (
              <p style={{ color: "#a0aec0", fontStyle: "italic" }}>أنت غير مسجَّل في أي دورة.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {data.enrollments.map((e) => (
                  <div key={e.id} style={{ padding: "1.25rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>{e.course?.title || "دورة"}</h3>
                    <span style={{
                      display: "inline-block",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "12px",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      background: e.statut === "VALIDE" ? "#f0fff4" : e.statut === "REJETE" ? "#fff5f5" : "#fffff0",
                      color: e.statut === "VALIDE" ? "#276749" : e.statut === "REJETE" ? "#c53030" : "#b7791f",
                      marginBottom: "0.75rem",
                    }}>
                      {e.statut === "VALIDE" ? "✅ مقبول" : e.statut === "REJETE" ? "❌ مرفوض" : "⏳ قيد الانتظار"}
                    </span>
                    {e.statut === "VALIDE" && (
                      <>
                        <div style={{ width: "100%", background: "#e2e8f0", height: "6px", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${e.progression || 0}%`, background: "#4299e1", height: "100%" }} />
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#718096", marginTop: "0.25rem", display: "block" }}>
                          التقدّم: {e.progression || 0}%
                        </span>
                        <a href={`/dashboard/student/courses/${e.courseId}`} className="btn-dent-blue" style={{
                          display: "flex",
                          marginTop: "0.75rem",
                          padding: "0.5rem",
                          fontSize: "0.9rem",
                        }}>
                          ▶️ الدخول إلى الدورة
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catalogue */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#4a5568" }}>
                🗂️ كتالوج الدورات ({data.catalogue?.length || 0})
              </h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <select
                  value={filtreNiveau}
                  onChange={(e) => {
                    const niv = e.target.value;
                    setFiltreNiveau(niv);
                    setFiltreAnnee(""); // Reset annee
                    setFiltreMatiere(""); // Reset matiere
                    fetchCourses(niv, "", "");
                  }}
                  style={{
                    padding: "0.6rem 1rem", borderRadius: "10px", border: "2px solid #e2e8f0", outline: "none", fontWeight: "600", color: "#4a5568", backgroundColor: "white", cursor: "pointer", appearance: "none", minWidth: "140px"
                  }}
                >
                  <option value="">🏫 كل المستويات</option>
                  <option value="college">🏫 متوسط</option>
                  <option value="lycee">🎓 ثانوي</option>
                </select>

                {filtreNiveau && (
                  <select
                    value={filtreAnnee}
                    onChange={(e) => {
                      const ann = e.target.value;
                      setFiltreAnnee(ann);
                      setFiltreMatiere(""); // Reset matiere
                      fetchCourses(filtreNiveau, ann, "");
                    }}
                    style={{
                      padding: "0.6rem 1rem", borderRadius: "10px", border: "2px solid #e2e8f0", outline: "none", fontWeight: "600", color: "#4a5568", backgroundColor: "white", cursor: "pointer", appearance: "none", minWidth: "140px"
                    }}
                  >
                    <option value="">📅 كل السنوات</option>
                    {anneesDisponibles.map((a) => (
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
                      fetchCourses(filtreNiveau, filtreAnnee, mat);
                    }}
                    style={{
                      padding: "0.6rem 1rem", borderRadius: "10px", border: "2px solid #e2e8f0", outline: "none", fontWeight: "600", color: "#4a5568", backgroundColor: "white", cursor: "pointer", appearance: "none", minWidth: "140px"
                    }}
                  >
                    <option value="">📘 كل المواد</option>
                    {MATIERES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            {data.catalogue?.length === 0 ? (
              <p style={{ color: "#a0aec0", fontStyle: "italic", textAlign: "center", padding: "3rem", backgroundColor: "white", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>لا توجد أي دورة تطابق هذا البحث.</p>
            ) : (
              <div>
                {(() => {
                  const groups = {};
                  const sortedCourses = [...data.catalogue].sort((a, b) => {
                    const numA = parseInt((a.title || "").match(/\d+/)?.[0] || 0);
                    const numB = parseInt((b.title || "").match(/\d+/)?.[0] || 0);
                    if (numA !== numB) return numA - numB;
                    return (a.title || "").localeCompare(b.title || "", undefined, { numeric: true, sensitivity: "base" });
                  });
                  sortedCourses.forEach(c => {
                    const key = `${c.niveau}|${c.annee}|${c.matiere}`;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(c);
                  });

                  return Object.keys(groups).map((key) => {
                    const groupCourses = groups[key];
                    const firstCourse = groupCourses[0];
                    const subjectTheme = getMatiereStyles(firstCourse.matiere) || { color: "#4A5568", background: "#F7FAFC" };
                    const subjectIcon = getSubjectIcon ? getSubjectIcon(firstCourse.matiere) : "📘";

                    const nv = firstCourse.niveau ? getNiveauLabel(firstCourse.niveau) : "";
                    const an = firstCourse.annee ? firstCourse.annee : "";
                    const mat = getMatiereLabel(firstCourse.matiere) || firstCourse.matiere;
                    const headerLabel = (an ? [an, mat] : [nv, mat]).filter(Boolean).join(" • ");

                    return (
                      <div key={key} style={{ marginBottom: "3rem" }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem",
                          padding: "1rem 1.5rem", borderRadius: "12px", background: subjectTheme.background,
                          borderRight: `6px solid ${subjectTheme.color}`
                        }}>
                          <span style={{ fontSize: "2rem" }}>{subjectIcon}</span>
                          <h2 style={{ margin: 0, color: subjectTheme.color, fontSize: "1.4rem", fontWeight: "800" }}>
                            {headerLabel}
                          </h2>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                          {groupCourses.map((c) => {
                            const enrollment = c.enrollments?.[0] || null;
                            const subjectIconCourse = getSubjectIcon ? getSubjectIcon(c.matiere) : "📘";
                            const subjectDeco = getSubjectDecorations ? getSubjectDecorations(c.matiere) : "📖  📝  ✏️";
                            
                            const primaryColor = subjectTheme.color || "#4A5568";
                            const bgColor = `${primaryColor}12`;
                            const displayNiveau = c.niveau === 'college' ? 'متوسط' : c.niveau === 'lycee' ? 'ثانوي' : c.niveau;
                            const badgeLabel = c.annee || displayNiveau;

                            return (
                              <div key={c.id} style={{ 
                                display: "flex", flexDirection: "column",
                                background: "white", 
                                border: `2px solid ${primaryColor}20`, 
                                borderRadius: "20px", 
                                boxShadow: "0 10px 25px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02)", 
                                overflow: "hidden",
                                transition: "transform 0.2s, box-shadow 0.2s",
                                cursor: "pointer"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-4px)";
                                e.currentTarget.style.boxShadow = `0 15px 35px ${primaryColor}18`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "none";
                                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02)";
                              }}
                              >
                                {/* Banner part */}
                                <div style={{
                                  height: "110px",
                                  background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "1rem 1.5rem",
                                  position: "relative",
                                  borderBottom: `3px solid ${primaryColor}30`
                                }}>
                                  <div style={{ fontSize: "2.8rem", marginBottom: "0.25rem" }}>{subjectIconCourse}</div>
                                  <div style={{ fontSize: "0.7rem", color: primaryColor, opacity: 0.6, letterSpacing: "3px", fontWeight: "600" }}>{subjectDeco}</div>
                                  <div style={{
                                    position: "absolute", top: "0.5rem", right: "0.5rem",
                                    backgroundColor: primaryColor,
                                    color: "white",
                                    padding: "0.25rem 0.7rem",
                                    borderRadius: "12px",
                                    fontWeight: "700",
                                    fontSize: "0.7rem",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase"
                                  }}>
                                    {badgeLabel}
                                  </div>
                                </div>

                                {/* Content part */}
                                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                                  <h3 style={{ fontWeight: "800", color: "#1e293b", fontSize: "1.2rem", marginBottom: "0.5rem", lineHeight: "1.4" }}>{c.title}</h3>
                                  
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                                    <span style={{
                                      padding: "0.2rem 0.6rem",
                                      borderRadius: "6px",
                                      backgroundColor: bgColor,
                                      color: primaryColor,
                                      fontWeight: "700",
                                      fontSize: "0.8rem"
                                    }}>{subjectIconCourse} {getMatiereLabel(c.matiere)}</span>
                                    <span style={{
                                      padding: "0.2rem 0.6rem",
                                      borderRadius: "6px",
                                      backgroundColor: "#f1f5f9",
                                      color: "#64748b",
                                      fontWeight: "700",
                                      fontSize: "0.8rem"
                                    }}>📖 {c.chapters?.length || 0} فصول</span>
                                  </div>
                                  
                                  <div style={{ marginTop: "auto" }}>
                                    <p style={{
                                      fontSize: "1.1rem",
                                      fontWeight: "800",
                                      color: c.prix ? "#f97316" : "#10b981", 
                                      marginBottom: "1rem"
                                    }}>
                                      {c.prix ? `💰 ${c.prix.toLocaleString("fr-FR")} د.ج` : "🎁 مجاني"}
                                    </p>
                                    
                                    <div style={{ width: "100%" }}>
                                      {btnStatut(enrollment, c.id)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
