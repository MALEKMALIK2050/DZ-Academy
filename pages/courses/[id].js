import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CourseDetails() {
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pretest, setPretest] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const courseId = Array.isArray(router.query.id)
      ? router.query.id[0]
      : router.query.id;

    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/courses/${courseId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Cours introuvable");
          setCourse(null);
          return;
        }

        setCourse(data);

        // Charger le pretest
        if (data.pretest) {
          setPretest(data.pretest);
          console.log('✅ Pretest chargé:', data.pretest);
        }
      } catch (err) {
        setError("Erreur serveur");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [router.isReady, router.query.id]);

  if (loading) return <p>Chargement du cours...</p>;

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  if (!course) return <p>Cours introuvable</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{course.title}</h1>

      {course.description && <p>{course.description}</p>}

      <hr />

      {pretest && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fef3c7', borderRadius: '10px', border: '2px solid #f59e0b' }}>
          <h2>🎯 Pretest Initial</h2>
          <p>Évaluez vos connaissances avant de commencer le cours.</p>
          <button
            onClick={() => router.push(`/pretest/${pretest.id}?courseId=${course.id}`)}
            style={{
              background: '#f59e0b',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              marginTop: '1rem',
            }}
          >
            ▶️ Commencer le pretest
          </button>
        </div>
      )}

      <hr />

      <h2>📚 Chapitres</h2>

      {course.chapters?.length > 0 ? (
        course.chapters.map((chap, index) => (
          <div key={index}>
            <h3>{chap.title}</h3>
            <p>{chap.content}</p>
          </div>
        ))
      ) : (
        <p>Aucun chapitre pour ce cours</p>
      )}
    </div>
  );
}