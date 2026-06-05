import { useState } from "react";
import { useRouter } from "next/router";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // On appelle l'API backend sécurisée que l'on a placée dans pages/api/auth/register.js
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      alert("🎉 Compte créé avec succès ! Vos identifiants ont été envoyés par e-mail.");
      router.push("/login"); // Redirection vers votre page de connexion après succès
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        border: "1px solid #e2e8f0"
      }}>
        <h2 style={{ textAlign: "center", color: "#059669", margin: "0 0 1.5rem" }}>📝 Inscription</h2>
        
        {error && (
          <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem", border: "1px solid #fecaca" }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.9rem" }}>Prénom</label>
            <input name="prenom" required value={form.prenom} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.9rem" }}>Nom</label>
            <input name="nom" required value={form.nom} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.9rem" }}>Email</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.9rem" }}>Mot de passe</label>
            <input name="password" type="password" required value={form.password} onChange={handleChange} style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={{
            background: "linear-gradient(135deg, #059669, #10b981)",
            color: "white",
            padding: "0.75rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "1rem",
            marginTop: "0.5rem"
          }}>
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.6rem",
  border: "1px solid #cbd5e0",
  borderRadius: "8px",
  boxSizing: "border-box",
  fontSize: "0.95rem"
};