import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Gérer les messages de l'URL
  useState(() => {
    if (router.query.verified === "true") {
      setSuccess("✅ Compte activé avec succès ! Vous pouvez vous connecter.");
    }
    if (router.query.error === "token_invalide") {
      setError("❌ Lien d'activation invalide ou expiré.");
    }
    if (router.query.error === "Compte désactivé") {
      setError("⏳ Veuillez activer votre compte via l'email reçu.");
    }
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        return;
      }

      if (data.success) {
        const role = data.user?.role?.toLowerCase();

        if (role) {
          router.replace(`/dashboard/${role}`);
        } else {
          router.replace("/");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Connexion</h2>

        {success && <p style={{ color: "#059669", fontWeight: "600", marginBottom: "1rem" }}>{success}</p>}
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div style={{ textAlign: "right", marginBottom: "1rem" }}>
            <Link href="/forgot-password" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}>
              Mot de passe oublié ?
            </Link>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}