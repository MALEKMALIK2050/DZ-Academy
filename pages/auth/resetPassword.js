import crypto from 'crypto';


// Génère un token sécurisé
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 caractères hexadécimaux
}

// Fonction pour envoyer le mail de reset
export async function resetPassword(email) {
  try {
    // 1. Générer un token unique
    const token = generateResetToken();

    // 2. Construire le lien de reset (local pour l’instant)
    const resetLink = `http://localhost:3000/auth/reset?token=${token}`;

    // 3. Envoyer le mail
    await sendMail(
      email,
      'Réinitialisation de votre mot de passe',
      `<p>Vous avez demandé à réinitialiser votre mot de passe.</p>
       <p>Cliquez sur ce lien pour continuer : <a href="${resetLink}">${resetLink}</a></p>`
    );

    console.log('Mail de réinitialisation envoyé avec succès');
    return token; // tu peux stocker ce token en BDD pour vérifier plus tard
  } catch (error) {
    console.error('Erreur lors de l’envoi du mail de réinitialisation:', error);
  }
}


// ─── Page React (obligatoire pour Next.js dans /pages/) ───────────────────
import { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || "Erreur lors de l'envoi.");
      }
    } catch {
      setError("Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7fafc" }}>
      <div style={{ background: "white", padding: "2.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", width: "100%", maxWidth: "420px" }}>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", color: "#2d3748" }}>🔒 Mot de passe oublié</h1>

        {sent ? (
          <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", padding: "1rem", borderRadius: "8px", color: "#276749" }}>
            ✅ Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.
          </div>
        ) : (
          <>
            <p style={{ color: "#718096", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", fontWeight: "600", color: "#4a5568", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                style={{ width: "100%", padding: "0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "1rem", boxSizing: "border-box", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#3182ce")}
                onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
              />
              {error && <p style={{ color: "#e53e3e", fontSize: "0.85rem", margin: "0.5rem 0 0" }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{ marginTop: "1.25rem", width: "100%", padding: "0.85rem", background: loading ? "#a0aec0" : "#3182ce", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <a href="/auth/login" style={{ color: "#3182ce", fontSize: "0.9rem", textDecoration: "none" }}>
            ← Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}