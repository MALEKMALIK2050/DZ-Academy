// ======================================================
// FICHIER : pages/index.js
// MODIFICATION : Ajout des enrollments pour l'utilisateur connecté
// ======================================================

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import AnimatedLogo from "../components/AnimatedLogo";
import { getMatiereStyles, getSubjectIcon, getSubjectDecorations } from "@/lib/constants";

const AnimatedCounter = ({ target, label, icon }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <div ref={ref} style={{
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      borderRadius: "20px",
      padding: "2.5rem 2rem",
      textAlign: "center",
      boxShadow: "0 10px 30px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
      flex: "1",
      minWidth: "250px",
      transform: isVisible ? "translateY(0)" : "translateY(20px)",
      opacity: isVisible ? 1 : 0,
      transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
    }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{icon}</div>
      <div style={{ fontSize: "3.5rem", fontWeight: "900", color: "#059669", lineHeight: "1", marginBottom: "0.5rem" }} dir="ltr">
        +{count.toLocaleString('ar-DZ')}
      </div>
      <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
        {label}
      </div>
    </div>
  );
};


const MATIERES = [
  { value: "math",                label: "الرياضيات" },
  { value: "physique",            label: "الفيزياء والكيمياء" },
  { value: "svt",                 label: "علوم الحياة والأرض" },
  { value: "informatique",        label: "الإعلام الآلي" },
  { value: "histoire",            label: "التاريخ والجغرافيا" },
  { value: "francais",            label: "اللغة الفرنسية" },
  { value: "anglais",             label: "اللغة الإنجليزية" },
  { value: "arabe",               label: "اللغة العربية" },
  { value: "philosophie",         label: "الفلسفة" },
  { value: "education_islamique", label: "التربية الإسلامية" },
  { value: "allemand",            label: "اللغة الألمانية" },
  { value: "italien",             label: "اللغة الإيطالية" },
];
const ANNEES_COLLEGE = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const ANNEES_LYCEE   = ["السنة الأولى ثانوي", "السنة الثانية ثانوي", "السنة الثالثة ثانوي"];

export default function Home() {
  const [index, setIndex] = useState(0);
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [niveau, setNiveau]     = useState("");
  const [matiere, setMatiere]   = useState("");
  const [annee, setAnnee]       = useState("");
  const [stats, setStats]       = useState({ courses: 0, students: 0, teachers: 0 });

  const items = [
    { title: "🤝 تعلم تعاوني", text: "العمل الجماعي هو أنجع وسيلة للتعلم" },
    { title: "🧘 الاستقلالية", text: "عزّز حافزك لتطوير عزيمتك في التعلم" },
    { title: "📚 دروس تفاعلية", text: "تعلّم بسهولة من خلال دروس بسيطة وملائمة" },
    { title: "🎯 تمارين", text: "اختبر معلوماتك بشكل دوري" },
    { title: "🏆 التقدّم", text: "تابع تطورك وحقّق أهدافك" }
  ];

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/public/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          courses: data.courses || 0,
          students: data.students || 0,
          teachers: data.teachers || 0
        });
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  // ✅ AJOUT : credentials: "include" pour envoyer le cookie
  const fetchCourses = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.niveau)  params.append("niveau",  filters.niveau);
      if (filters.matiere) params.append("matiere", filters.matiere);
      if (filters.annee)   params.append("annee",   filters.annee);

      const res = await fetch(`/api/courses/public?${params.toString()}`, {
        credentials: "include", // ✅ IMPORTANT
      });
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCourses({ niveau, matiere, annee });
  };

  const handleReset = () => {
    setNiveau("");
    setMatiere("");
    setAnnee("");
    fetchCourses({});
  };

  const anneesDisponibles = niveau === "college" ? ANNEES_COLLEGE : niveau === "lycee" ? ANNEES_LYCEE : [...ANNEES_COLLEGE, ...ANNEES_LYCEE];

  return (
    <div dir="rtl" lang="ar">
      {/* HERO ARTISTIQUE — COULEURS HAUT CONTRASTE */}
      <section className="hero-artistic" style={{
        position: "relative",
        padding: "4rem 1.5rem 3.5rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}>
        <div className="hero-badge-artistic">
          <span style={{ color: "#FBBF24" }}>✦</span>
          <span>منصة التفوق للتعليم الثانوي والمتوسط في الجزائر</span>
          <span style={{ color: "#FBBF24" }}>✦</span>
        </div>

        <h1 className="hero-title-artistic">
          📚 تعلّم بطريقة مختلفة
        </h1>

        <div className="hero-subtitle-artistic">
          دروس <span style={{ color: "#047857", background: "#E6F4EA", padding: "2px 8px", borderRadius: "6px" }}>بسيطة، ممتعة وفعّالة</span> — محترفو التعليم عن بعد يتكفلون بمتابعتك نحو النجاح 🚀
        </div>

        <div style={{ display: "flex", gap: "1.25rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <Link href="/register" className="btn-artistic-register">
            <span>🚀</span>
            <span>سجّل الآن</span>
          </Link>
          <Link href="/about" className="btn-artistic-about">
            <span>🤝</span>
            <span>التزامنا</span>
          </Link>
        </div>
      </section>

      {/* CAROUSEL 3D */}
      <section className="carousel">
        <div className="carousel-container">
          {items.map((item, i) => {
            const position = (i - index + items.length) % items.length;
            return (
              <div key={i} className={`carousel-card pos-${position}`} onClick={() => setIndex(i)}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CATALOGUE DES COURS */}
      <section style={{ padding: "4rem 1rem", background: "#f8fafc" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 style={{ fontFamily: "'Aref Ruqaa', 'Amiri', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: "700", color: "#1e293b", margin: "0 0 0.5rem" }}>
              📚 كتالوج دوراتنا
            </h2>
            <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
              اكتشف كتالوج دوراتنا — سجّل للوصول إلى المحتوى
            </p>
          </div>

          {/* Filtres */}
          <div style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            marginBottom: "2rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            alignItems: "end",
          }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", color: "#4a5568", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                🎓 المستوى
              </label>
              <select
                value={niveau}
                onChange={(e) => { 
                  setNiveau(e.target.value); 
                  setAnnee(""); 
                  setMatiere(""); 
                }}
                style={{ width: "100%", padding: "0.65rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.95rem", cursor: "pointer", backgroundColor: "white" }}
              >
                <option value="">جميع المستويات</option>
                <option value="college">المتوسط</option>
                <option value="lycee">الثانوي</option>
              </select>
            </div>

            {niveau && (
              <div>
                <label style={{ display: "block", fontWeight: "600", color: "#4a5568", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                  📅 القسم
                </label>
                <select
                  value={annee}
                  onChange={(e) => {
                    setAnnee(e.target.value);
                    setMatiere("");
                  }}
                  style={{ width: "100%", padding: "0.65rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.95rem", cursor: "pointer", backgroundColor: "white" }}
                >
                  <option value="">جميع الأقسام</option>
                  {anneesDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}

            {annee && (
              <div>
                <label style={{ display: "block", fontWeight: "600", color: "#4a5568", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                  📖 المادة
                </label>
                <select
                  value={matiere}
                  onChange={(e) => setMatiere(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.95rem", cursor: "pointer", backgroundColor: "white" }}
                >
                  <option value="">جميع المواد</option>
                  {MATIERES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleSearch}
                style={{ flex: 1, padding: "0.65rem", background: "linear-gradient(135deg, #059669, #10b981)", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.95rem" }}
              >
                🔍 بحث
              </button>
              <button
                onClick={handleReset}
                style={{ padding: "0.65rem 1rem", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Liste des cours */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              ⏳ جارٍ تحميل الدورات...
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
              <p>لا توجد دورات متاحة لهذه المعايير.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {[...courses].sort((a, b) => {
                  const numA = parseInt((a.title || "").match(/\d+/)?.[0] || 0);
                  const numB = parseInt((b.title || "").match(/\d+/)?.[0] || 0);
                  if (numA !== numB) return numA - numB;
                  return (a.title || "").localeCompare(b.title || "", undefined, { numeric: true, sensitivity: "base" });
                }).map((course) => {
                  const subjectTheme = getMatiereStyles ? getMatiereStyles(course.matiere) : { color: "#4A5568", background: "#F7FAFC15" };
                  const subjectIcon = getSubjectIcon ? getSubjectIcon(course.matiere) : "📘";
                  const subjectDeco = getSubjectDecorations ? getSubjectDecorations(course.matiere) : "📖  📝  ✏️";
                  
                  // Extract colors for the modern UI
                  const primaryColor = subjectTheme.color || "#4A5568";
                  const bgColor = primaryColor + "12";

                  const displayNiveau = course.niveau === "college" ? "المتوسط" : course.niveau === "lycee" ? "الثانوي" : course.niveau;
                  const displayMatiere = MATIERES.find(m => m.value === course.matiere)?.label || course.matiere;

                  const enrollment = course.enrollments?.[0] || null;
                  const isEnrolled = enrollment && (enrollment.statut === "VALIDE" || enrollment.statut === "PAYE" || enrollment.statut === "GRATUIT");
                  const isPending = enrollment && enrollment.statut === "EN_ATTENTE";

                  return (
                    <div key={course.id} className="course-card-item" style={{ 
                      display: "flex", flexDirection: "column",
                      background: "white", 
                      border: "2px solid " + primaryColor + "20", 
                      borderRadius: "20px", 
                      boxShadow: "0 10px 25px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02)", 
                      position: "relative",
                      cursor: "pointer"
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
                        height: "110px",
                        background: "linear-gradient(135deg, " + primaryColor + "15, " + primaryColor + "08)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1rem 1.5rem",
                        position: "relative",
                        borderBottom: "3px solid " + primaryColor + "30",
                        borderRadius: "18px 18px 0 0",
                        overflow: "hidden"
                      }}>
                        <div style={{ fontSize: "2.8rem", marginBottom: "0.25rem" }}>{subjectIcon}</div>
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
                          {displayNiveau} {course.annee ? ("• " + course.annee) : ""}
                        </div>
                      </div>

                      {/* Content part */}
                      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                        <div className="course-title-container">
                          <div className="course-title-hoverable">
                            <h3 style={{ fontWeight: "800", color: "#1e293b", fontSize: "1.2rem", margin: 0, lineHeight: "1.4" }}>
                              {course.title}
                            </h3>
                            <span className="course-title-hint">💡 وصف</span>
                          </div>
                          <div className="course-title-tooltip">
                            <div className="course-title-tooltip-header">
                              <span>💡</span> <span>وصف الدرس :</span>
                            </div>
                            <div style={{ color: "#e2e8f0", fontSize: "0.88rem", lineHeight: "1.7" }}>
                              {course.description || "لا يوجد وصف محدد لهذا الدرس."}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                          <span style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "6px",
                            backgroundColor: bgColor,
                            color: primaryColor,
                            fontWeight: "700",
                            fontSize: "0.8rem"
                          }}>{subjectIcon} {displayMatiere}</span>
                        </div>
                        
                        <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6", flexGrow: 1 }}>
                          {course.description ? course.description.substring(0, 80) + "..." : "لا يوجد وصف."}
                        </p>
                        
                        <div style={{ marginTop: "1rem", textAlign: "center" }}>
                          {isEnrolled ? (
                            <Link 
                              href={`/dashboard/student/courses/${course.id}`}
                              style={{
                                display: "inline-block",
                                width: "100%",
                                padding: "0.65rem",
                                background: "linear-gradient(135deg, #059669, #10b981)",
                                color: "white",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontWeight: "700",
                                fontSize: "0.9rem",
                                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                              }}
                            >
                              ✅ تم التسجيل
                            </Link>
                          ) : isPending ? (
                            <div 
                              style={{
                                display: "inline-block",
                                width: "100%",
                                padding: "0.65rem",
                                background: "#fef3c7",
                                color: "#d97706",
                                borderRadius: "8px",
                                fontWeight: "700",
                                fontSize: "0.9rem",
                                border: "1px solid #fde68a"
                              }}
                            >
                              ⏳ قيد الانتظار
                            </div>
                          ) : (
                            <Link 
                              href={`/courses/${course.id}`}
                              style={{
                                display: "inline-block",
                                width: "100%",
                                padding: "0.65rem",
                                background: "linear-gradient(135deg, #059669, #10b981)",
                                color: "white",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontWeight: "700",
                                fontSize: "0.9rem",
                              }}
                            >
                              🚀 سجّل للوصول
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
              })}
            </div>
          )}
        </div>
      </section>

      {/* STATS SECTION */}
      <section style={{ 
        padding: "6rem 1rem", 
        backgroundColor: "#f7f3ec",
        backgroundImage: "url('/images/bg-algerian.png')",
        backgroundSize: "400px",
        backgroundRepeat: "repeat",
        position: "relative"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(247, 243, 236, 0.9)" }}></div>
        
        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: "900", color: "#1e293b", margin: "0 0 1rem", letterSpacing: "-1px" }}>
              انضم إلى التميز
            </h2>
            <p style={{ fontSize: "1.2rem", color: "#64748b", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
              المنصة التعليمية الأولى بأرقام تتحدث عن نفسها.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
            <AnimatedCounter target={stats.courses} label="الدروس المتاحة" icon="📚" />
            <AnimatedCounter target={stats.students} label="الطلاب النشطين" icon="🎓" />
            <AnimatedCounter target={stats.teachers} label="الأساتذة الخبراء" icon="👨‍🏫" />
          </div>
        </div>
      </section>
    </div>
  );
}