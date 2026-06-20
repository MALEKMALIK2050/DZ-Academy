import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setMessage("Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.");
      
      // Optionnel: Rediriger vers la page de login après quelques secondes
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err) {
      console.error(err);
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <h2>Lien invalide</h2>
          <p className="error">Le lien de réinitialisation est manquant ou invalide.</p>
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link href="/login" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Nouveau mot de passe</h2>
        <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "#666" }}>
          Veuillez entrer votre nouveau mot de passe.
        </p>

        {message ? (
          <div>
            <p style={{ color: "#059669", fontWeight: "600", marginBottom: "1rem" }}>{message}</p>
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <Link href="/login" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}>
                Aller à la page de connexion
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}

            <input
              name="password"
              type="password"
              placeholder="Nouveau mot de passe"
              value={form.password}
              onChange={handleChange}
              required
            />

            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirmer le mot de passe"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Réinitialisation..." : "Enregistrer le mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
