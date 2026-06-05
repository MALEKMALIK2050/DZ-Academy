import { useState, useEffect } from "react";

export default function StudentCoursesPage() {
  const [catalogue, setCatalogue] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Récupérer les cours au chargement
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/student/courses");
        if (!res.ok) throw new Error("Impossible de charger les cours");
        const data = await res.json();
        setCatalogue(data.catalogue || []);
        setEnrollments(data.enrollments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // S'inscrire à un cours
  const handleEnroll = async (courseId) => {
    try {
      const res = await fetch("/api/student/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur d'inscription");
      }
      // Recharger les données après inscription
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  // Se désinscrire
  const handleUnenroll = async (courseId) => {
    if (!confirm("Voulez-vous vraiment vous désinscrire de ce cours ?")) return;
    try {
      const res = await fetch("/api/student/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) throw new Error("Erreur de désinscription");
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Chargement des cours...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>Erreur : {error}</div>;

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Mes Cours & Catalogues</h1>

      {/* Section 1 : Cours inscrits */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Mes cours en cours ({enrollments.length})</h2>
        {enrollments.length === 0 ? (
          <p>Vous n'êtes inscrit à aucun cours pour le moment.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {enrollments.map((enr) => (
              <div key={enr.id} style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "8px" }}>
                <h3>{enr.course?.title}</h3>
                <p>Enseignant : {enr.course?.teacher?.prenom} {enr.course?.teacher?.nom}</p>
                <button 
                  onClick={() => handleUnenroll(enr.courseId)}
                  style={{ backgroundColor: "#ff4d4d", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}
                >
                  Se désinscrire
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2 : Catalogue disponible */}
      <section>
        <h2>Catalogue des cours disponibles ({catalogue.length})</h2>
        {catalogue.length === 0 ? (
          <p>Aucun autre cours n'est publié actuellement.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {catalogue
              .filter(c => !enrollments.some(e => e.courseId === c.id)) // Ne pas afficher ce à quoi on est déjà inscrit
              .map((course) => (
                <div key={course.id} style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "8px" }}>
                  <h3>{course.title}</h3>
                  <p>{course.niveau} - {course.matiere}</p>
                  <p>Enseignant : {course.teacher?.prenom} {course.teacher?.nom}</p>
                  <button 
                    onClick={() => handleEnroll(course.id)}
                    style={{ backgroundColor: "#0070f3", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}
                  >
                    S'inscrire au cours
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}