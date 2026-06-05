import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function StudentQuizPage() {
  const router = useRouter();
  const { quizId } = router.query;

  const [status, setStatus] = useState(null);
  const [reponses, setReponses] = useState({});
  const [resultatSubmit, setResultatSubmit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quizId) return;

    // Charger les informations sur les tentatives de l'étudiant
    fetch(`/api/student/quiz?quizId=${quizId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des statuts du quiz");
        return res.json();
      })
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [quizId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/student/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, reponses }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la soumission");
      }

      setResultatSubmit(data);
      // Mettre à jour l'état local du statut du quiz
      setStatus({
        tentatives: data.tentatives,
        maxTentatives: status.maxTentatives,
        score: data.score,
        reussi: data.reussi,
        bloque: data.bloque,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) return <p style={{ padding: "20px" }}>Chargement du quiz...</p>;

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "10px" }}>Évaluation du module</h1>

      {error && <p style={{ color: "#e53e3e", padding: "10px", background: "#fff5f5" }}>⚠️ {error}</p>}

      {status?.bloque ? (
        <div style={{ padding: "20px", background: "#fff5f5", borderLeft: "4px solid #e53e3e", marginTop: "20px" }}>
          <h3>⚠️ Nombre maximal de tentatives atteint</h3>
          <p>Vous avez fait <strong>{status.tentatives} tentatives</strong> et n'avez pas atteint le score minimum exigé.</p>
          <p><em>Contactez votre enseignant pour débloquer votre accès et suivre une remédiation pédagogique.</em></p>
        </div>
      ) : status?.reussi ? (
        <div style={{ padding: "20px", background: "#f0fff4", borderLeft: "4px solid #38a169", marginTop: "20px" }}>
          <h3>Congratulations ! 🎉</h3>
          <p>Vous avez validé ce quiz avec succès avec un score de <strong>{status.score}%</strong> !</p>
          <p>Vous pouvez passer sereinement aux étapes ou modules suivants.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: "30px" }}>
          <div style={{ marginBottom: "20px", padding: "15px", background: "#f7fafc" }}>
            <p style={{ margin: "5px 0" }}>Tentatives utilisées : <strong>{status?.tentatives || 0} / {status?.maxTentatives}</strong></p>
            {status?.score !== null && (
              <p style={{ margin: "5px 0" }}>Meilleur score actuel : <strong>{status?.score}%</strong></p>
            )}
          </div>

          <div style={{ border: "1px solid #eaeaea", borderRadius: "8px", padding: "20px", background: "#ffffff" }}>
            <h4 style={{ marginTop: 0 }}>Répondez avec soin :</h4>
            <p style={{ color: "#718096" }}>Exemple : saisissez vos réponses dans le formulaire de l'évaluation.</p>
            {/* L'interface affichera dynamiquement les questions ici */}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              background: "#3182ce",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Calcul du score..." : "Soumettre mes réponses"}
          </button>
        </form>
      )}

      {resultatSubmit && (
        <div style={{ marginTop: "30px", padding: "20px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: "8px" }}>
          <h3>Résultat de votre soumission :</h3>
          <p style={{ fontSize: "1.1em", fontWeight: "bold" }}>Score : {resultatSubmit.score}%</p>
          <p>{resultatSubmit.message}</p>
        </div>
      )}
    </div>
  );
}