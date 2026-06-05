import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState("loading"); // "loading", "success", "error"
  const [message, setMessage] = useState("Vérification de votre compte en cours...");

  useEffect(() => {
    // On attend que Next.js charge l'URL et que le token soit disponible
    if (!router.isReady || !token) return;

    const verifyToken = async () => {
      try {
        // On appelle l'API backend sécurisée placée dans pages/api/auth/verify-email.js
        const res = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: "GET",
        });
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Votre compte a été vérifié avec succès !");
        } else {
          setStatus("error");
          setMessage(data.error || "Le lien de vérification est invalide ou a expiré.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Erreur de connexion avec le serveur.");
      }
    };

    verifyToken();
  }, [router.isReady, token]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{
        background: "white",
        padding: "2.5rem",
        borderRadius: "20px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        width: "100%",
        maxWidth: "450px",
        textAlign: "center",
        border: "1px solid #e2e8f0"
      }}>
        {status === "loading" && (
          <div>
            <h2 style={{ color: "#059669", marginBottom: "1rem" }}>⏳ Vérification...</h2>
            <p style={{ color: "#4b5563" }}>{message}</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <h2 style={{ color: "#059669", marginBottom: "1rem" }}>✅ Félicitations !</h2>
            <p style={{ color: "#065f46", background: "#f0fdf4", padding: "0.75rem", borderRadius: "8px", border: "1px solid #bbf7d0", marginBottom: "1.5rem" }}>
              {message}
            </p>
            <button onClick={() => router.push("/login")} style={btnStyle}>
              Se connecter
            </button>
          </div>
        )}

        {status === "error" && (
          <div>
            <h2 style={{ color: "#dc2626", marginBottom: "1rem" }}>❌ Échec de la vérification</h2>
            <p style={{ color: "#991b1b", background: "#fef2f2", padding: "0.75rem", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "1.5rem" }}>
              {message}
            </p>
            <button onClick={() => router.push("/register")} style={{ ...btnStyle, background: "#dc2626" }}>
              Recommencer l'inscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  background: "linear-gradient(135deg, #059669, #10b981)",
  color: "white",
  padding: "0.75rem 1.5rem",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "1rem",
  boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)"
};