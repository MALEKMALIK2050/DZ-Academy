// ======================================================
// FICHIER : pages/index.js
// MODIFICATION : Ajout des enrollments pour l'utilisateur connecté
// ======================================================

import Link from "next/link";
import { useState, useEffect } from "react";
import AnimatedLogo from "../components/AnimatedLogo";

const MATIERES = [
  { value: "math",                label: "Mathématiques" },
  { value: "physique",            label: "Physique & Chimie" },
  { value: "svt",                 label: "SVT" },
  { value: "informatique",        label: "Informatique" },
  { value: "histoire",            label: "Histoire & Géographie" },
  { value: "francais",            label: "Français" },
  { value: "anglais",             label: "Anglais" },
  { value: "arabe",               label: "Langue Arabe" },
  { value: "philosophie",         label: "Philosophie" },
  { value: "education_islamique", label: "Éducation Islamique" },
  { value: "allemand",            label: "Allemand" },
  { value: "italien",             label: "Italien" },
];
const ANNEES_COLLEGE = ["6ème", "5ème", "4ème", "3ème"];
const ANNEES_LYCEE   = ["1ère AS", "2ème AS", "Terminale"];

export default function Home() {
  const [index, setIndex] = useState(0);
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [niveau, setNiveau]     = useState("");
  const [matiere, setMatiere]   = useState("");
  const [annee, setAnnee]       = useState("");

  const items = [
    { title: "🤝 Pédagogie collaborative", text: "Travailler en groupe est le moyen le plus efficace pour apprendre" },
    { title: "🧘 Autonomie", text: "Boostez votre motivation pour développer votre détermination à apprendre" },
    { title: "📚 Cours interactifs", text: "Apprenez facilement avec des leçons simples et adaptées" },
    { title: "🎯 Exercices", text: "Testez vos connaissances périodiquement" },
    { title: "🏆 Progression", text: "Suivez votre évolution et réalisez vos objectifs" }
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

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
    <>
      {/* HERO */}
      <section className="hero">
        <h1>📚 Apprenez autrement</h1>
        <h2>Des cours simples, fun et efficaces</h2>
        <h2>Les professionnels de l'enseignement à distance vous prennent en charge</h2>
        <br />
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/about" className="btn btn-login">🤝 Notre engagement</Link>
          <Link href="/register" className="btn btn-register">🚀 S'inscrire maintenant</Link>
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
            <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: "800", color: "#1e293b", margin: "0 0 0.5rem" }}>
              📚 Nos Cours
            </h2>
            <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
              Découvrez notre catalogue de cours — inscrivez-vous pour accéder au contenu
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
                🎓 Niveau
              </label>
              <select
                value={niveau}
                onChange={(e) => { setNiveau(e.target.value); setAnnee(""); }}
                style={{ width: "100%", padding: "0.65rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.95rem" }}
              >
                <option value="">Tous les niveaux</option>
                <option value="college">Collège</option>
                <option value="lycee">Lycée</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", color: "#4a5568", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                📅 Classe
              </label>
              <select
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                style={{ width: "100%", padding: "0.65rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.95rem" }}
              >
                <option value="">Toutes les classes</option>
                {anneesDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", color: "#4a5568", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                📖 Matière
              </label>
              <select
                value={matiere}
                onChange={(e) => setMatiere(e.target.value)}
                style={{ width: "100%", padding: "0.65rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.95rem" }}
              >
                <option value="">Toutes les matières</option>
                {MATIERES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleSearch}
                style={{ flex: 1, padding: "0.65rem", background: "linear-gradient(135deg, #059669, #10b981)", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.95rem" }}
              >
                🔍 Rechercher
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
              ⏳ Chargement des cours...
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
              <p>Aucun cours disponible pour ces critères.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {courses.map((course) => {
                // ✅ Récupérer le statut d'inscription
                const enrollment = course.enrollments?.[0];
                const isEnrolled = enrollment?.statut === "PAYE" || enrollment?.statut === "GRATUIT";
                const isPending = enrollment?.statut === "EN_ATTENTE";
                const isRejected = enrollment?.statut === "REJETE";

                return (
                  <div
                    key={course.id}
                    style={{
                      background: "white",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                      border: isEnrolled 
                        ? "2px solid #059669" 
                        : isPending 
                          ? "2px solid #f59e0b" 
                          : "1px solid #e2e8f0",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
                  >
                    <div style={{
                      height: "120px",
                      background: isEnrolled 
                        ? "linear-gradient(135deg, #059669, #10b981)" 
                        : isPending 
                          ? "linear-gradient(135deg, #f59e0b, #d97706)" 
                          : "linear-gradient(135deg, #6b7280, #9ca3af)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "3rem",
                      position: "relative",
                    }}>
                      {course.coverImage
                        ? <img src={course.coverImage} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : "📚"
                      }
                      {isEnrolled && (
                        <span style={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          background: "#059669",
                          color: "white",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "20px",
                          fontSize: "0.7rem",
                          fontWeight: "700",
                        }}>
                          ✅ Inscrit
                        </span>
                      )}
                      {isPending && (
                        <span style={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          background: "#f59e0b",
                          color: "white",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "20px",
                          fontSize: "0.7rem",
                          fontWeight: "700",
                        }}>
                          ⏳ En attente
                        </span>
                      )}
                    </div>

                    <div style={{ padding: "1.25rem" }}>
                      <h3 style={{ margin: "0 0 0.5rem", fontWeight: "700", color: "#1e293b", fontSize: "1rem" }}>
                        {course.title}
                      </h3>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                        {course.niveau && (
                          <span style={{ background: "#f0fdf4", color: "#166534", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                            {course.niveau === "college" ? "Collège" : course.niveau === "lycee" ? "Lycée" : course.niveau}
                          </span>
                        )}
                        {course.annee && (
                          <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                            {course.annee}
                          </span>
                        )}
                        {course.matiere && (
                          <span style={{ background: "#fff7ed", color: "#c2410c", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                            {MATIERES.find(m => m.value === course.matiere)?.label || course.matiere}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "0 0 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                        {course.chapters?.length || 0} chapitre{course.chapters?.length !== 1 ? "s" : ""}
                        {course.teacher && ` • 👨‍🏫 ${course.teacher.prenom} ${course.teacher.nom}`}
                      </p>

                      {/* ✅ Bouton conditionnel */}
                      {isEnrolled ? (
                        <Link
                          href="/dashboard/student"
                          style={{
                            display: "block",
                            textAlign: "center",
                            padding: "0.65rem",
                            background: "linear-gradient(135deg, #059669, #10b981)",
                            color: "white",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: "700",
                            fontSize: "0.9rem",
                          }}
                        >
                          📖 Accéder au cours
                        </Link>
                      ) : isPending ? (
                        <div style={{
                          display: "block",
                          textAlign: "center",
                          padding: "0.65rem",
                          background: "#fffbeb",
                          color: "#92400e",
                          borderRadius: "8px",
                          border: "1px solid #f59e0b",
                          fontWeight: "600",
                          fontSize: "0.9rem",
                        }}>
                          ⏳ Demande en attente
                        </div>
                      ) : isRejected ? (
                        <div style={{
                          display: "block",
                          textAlign: "center",
                          padding: "0.65rem",
                          background: "#fef2f2",
                          color: "#dc2626",
                          borderRadius: "8px",
                          border: "1px solid #ef4444",
                          fontWeight: "600",
                          fontSize: "0.9rem",
                        }}>
                          ❌ Demande rejetée
                        </div>
                      ) : (
                        <Link
                          href="/register"
                          style={{
                            display: "block",
                            textAlign: "center",
                            padding: "0.65rem",
                            background: "linear-gradient(135deg, #059669, #10b981)",
                            color: "white",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: "700",
                            fontSize: "0.9rem",
                          }}
                        >
                          🚀 S'inscrire pour accéder
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}