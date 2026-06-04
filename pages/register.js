import { useState } from "react";
import { useRouter } from "next/router";

export default function RegisterStudent() {
  const router = useRouter();

  const [form, setForm] = useState({
    eleveNom: "",
    elevePrenom: "",
    niveau: "",
    classe: "",
    tuteurNom: "",
    tuteurPrenom: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Les mots de passe ne correspondent pas");
    }

    if (form.password.length < 6) {
      return setError("Mot de passe trop court (min 6 caractères)");
    }

    if (!form.niveau || !form.classe) {
      return setError("Choisir le cycle et la classe");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nom: form.eleveNom,
          prenom: form.elevePrenom,
          email: form.email,
          password: form.password,
          role: "student",
          niveau: form.niveau,
          classe: form.classe,
          tuteur: {
            nom: form.tuteurNom,
            prenom: form.tuteurPrenom,
            telephone: form.telephone,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return setError(data.error || "Erreur inscription");
      }

      router.push("/login");
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Inscription</h2>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <h3>👨‍🎓 Élève</h3>

          <input name="eleveNom" onChange={handleChange} placeholder="Nom de l'élève" />
          <input name="elevePrenom" onChange={handleChange} placeholder="Prénom de l'élève" />

          <select name="niveau" onChange={handleChange}>
            <option value="">Choisir niveau</option>
            <option value="college">Collège</option>
            <option value="lycee">Lycée</option>
          </select>

          {form.niveau === "college" && (
            <select name="classe" onChange={handleChange}>
              <option value="">Classe</option>
              <option value="6eme">6ème</option>
              <option value="5eme">5ème</option>
              <option value="4eme">4ème</option>
              <option value="3eme">3ème</option>
            </select>
          )}

          {form.niveau === "lycee" && (
            <select name="classe" onChange={handleChange}>
              <option value="">Classe</option>
              <option value="1AS">1AS</option>
              <option value="2AS">2AS</option>
              <option value="Terminale">Terminale</option>
            </select>
          )}

          <h3>👨‍👩‍👦 Tuteur</h3>

          <input name="tuteurNom" onChange={handleChange} placeholder="Nom tuteur" />
          <input name="tuteurPrenom" onChange={handleChange} placeholder="Prénom tuteur" />
          <input name="telephone" onChange={handleChange} placeholder="Téléphone" />

          <input name="email" type="email" onChange={handleChange} placeholder="Email" />
          <input name="password" type="password" onChange={handleChange} placeholder="Mot de passe" />
          <input name="confirmPassword" type="password" onChange={handleChange} placeholder="Confirmer mot de passe" />

          <button disabled={loading}>
            {loading ? "Création..." : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}