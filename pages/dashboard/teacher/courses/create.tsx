"use client";

import { useState } from "react";
import { useRouter } from "next/router";

export default function CreateCourse() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    matiere: "",
    niveau: "",
    annee: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.matiere || !form.niveau || !form.annee) {
      return setError("Titre, matière, niveau et année sont obligatoires");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.error || "Erreur création cours");
      router.push(`/dashboard/designer/courses/${data.id}`);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const anneesCollege = ["6eme", "5eme", "4eme", "3eme"];
  const anneesLycee = ["1AS", "2AS", "Terminale"];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <button
        onClick={() => router.push("/dashboard/designer")}
        style={{
          background: "none",
          border: "none",
          color: "#f97316",
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        ← Retour au dashboard
      </button>

      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "1.5rem" }}>
          ➕ Nouveau Cours
        </h1>

        {error && (
          <div
            style={{
              color: "#e53e3e",
              background: "#fff5f5",
              padding: "1rem",
              borderRadius: "12px",
              marginBottom: "1rem",
            }}
          >
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>Titre du cours *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "8px" }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>Matière *</label>
              <select
                name="matiere"
                value={form.matiere}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "8px" }}
                required
              >
                <option value="">Choisir...</option>
                <option value="math">Mathématiques</option>
                <option value="physique">Physique & Chimie</option>
                <option value="svt">SVT</option>
                <option value="informatique">Informatique</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>Niveau scolaire *</label>
              <select
                name="niveau"
                value={form.niveau}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "8px" }}
                required
              >
                <option value="">Choisir</option>
                <option value="college">Collège</option>
                <option value="lycee">Lycée</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>Année / Classe *</label>
              <select
                name="annee"
                value={form.annee}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "8px" }}
                required
                disabled={!form.niveau}
              >
                <option value="">Choisir</option>
                {(form.niveau === "college" ? anneesCollege : anneesLycee).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>Description courte</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e0", borderRadius: "8px", height: "100px" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#059669",
              color: "white",
              padding: "1rem",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              width: "100%",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Création..." : "🚀 Créer"}
          </button>
        </form>
      </div>
    </div>
  );
}