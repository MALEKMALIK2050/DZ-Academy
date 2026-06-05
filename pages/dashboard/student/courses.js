import { useEffect, useState } from "react";

export default function StudentCoursesPage() {
  const [data, setData] = useState({ catalogue: [], enrollments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Appelle le endpoint d'API sécurisé
    fetch("/api/student/courses")
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les cours");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "10px" }}>Mes Cours et Catalogue</h1>
      
      {loading && <p>Chargement des cours...</p>}
      {error && <p style={{ color: "#e53e3e" }}>{error}</p>}
      
      {!loading && !error && (
        <div style={{ marginTop: "20px" }}>
          <h2>Mes inscriptions ({data.enrollments?.length || 0})</h2>
          {data.enrollments?.length === 0 ? (
            <p>Vous n'êtes inscrit à aucun cours.</p>
          ) : (
            <ul>
              {data.enrollments?.map((e) => (
                <li key={e.id} style={{ margin: "10px 0" }}>
                  <strong>{e.course?.titre || "Cours"}</strong> - Progression : {e.progression || 0}%
                </li>
              ))}
            </ul>
          )}

          <h2 style={{ marginTop: "40px" }}>Catalogue des cours disponibles ({data.catalogue?.length || 0})</h2>
          {data.catalogue?.length === 0 ? (
            <p>Aucun cours n'est actuellement publié.</p>
          ) : (
            <ul>
              {data.catalogue?.map((c) => (
                <li key={c.id} style={{ margin: "10px 0" }}>
                  <strong>{c.titre}</strong> - par {c.teacher?.nom} {c.teacher?.prenom}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}