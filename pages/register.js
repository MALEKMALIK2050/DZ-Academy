// ======================================================
// FICHIER : pages/register.js (STYLISÉ VERT & ORANGE)
// ======================================================

import { useState } from "react";
import { useRouter } from "next/router";
import PolicyModal from "@/components/PolicyModal";

// ✅ CONTENU DES POLITIQUES (inchangé)
const CGU_CONTENT = `
<h3 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;">📜 CONDITIONS GÉNÉRALES D'UTILISATION</h3>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">Article 1 - Champ d'application</h4>
<p>Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme CB ACADEMY, accessible à l'adresse cb-academy-dz.vercel.app.</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">Article 2 - Acceptation des conditions</h4>
<p>L'inscription sur la plateforme implique l'acceptation pleine et entière des présentes CGU. L'utilisateur déclare avoir pris connaissance des conditions générales d'utilisation, de vente et de la politique de protection des données à caractère personnel et les accepte sans réserve.</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">Article 3 - Protection des données personnelles</h4>
<p>Conformément à la loi algérienne n°18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel :</p>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>Les données collectées sont strictement nécessaires à la gestion des inscriptions, du suivi pédagogique et des communications.</li>
  <li>L'utilisateur dispose d'un droit d'accès, de rectification et d'opposition sur ses données.</li>
  <li>Les données sont conservées pour une durée maximale de 5 ans après la dernière activité.</li>
  <li>Des mesures de sécurité sont mises en œuvre pour protéger les données.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">Article 4 - Propriété intellectuelle</h4>
<p>Les contenus mis à disposition sur la plateforme (cours, exercices, vidéos) sont protégés par le droit d'auteur. Toute reproduction ou diffusion est interdite sans autorisation.</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">Article 5 - Charte des enseignants</h4>
<p>L'enseignant s'engage à :</p>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>Utiliser la plateforme conformément à sa destination pédagogique.</li>
  <li>Respecter la confidentialité des informations relatives aux élèves.</li>
  <li>Garantir l'exactitude et la licéité des contenus déposés.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">Article 6 - Charte des étudiants et parents</h4>
<p>L'étudiant et ses parents s'engagent à :</p>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>Utiliser leurs identifiants de manière personnelle et confidentielle.</li>
  <li>Adopter un comportement respectueux dans les espaces d'échange.</li>
  <li>Ne pas tenter de contourner les mesures de sécurité.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">Article 7 - Droit applicable</h4>
<p>Les présentes CGU sont régies par le droit algérien. Tout litige relève de la compétence des tribunaux d'Alger.</p>
`;

const PREREQ_CONTENT = `
<h3 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;">💻 PRÉREQUIS TECHNIQUES</h3>

<p style="margin-bottom:1rem;">Pour suivre les formations sur la plateforme CB ACADEMY, l'utilisateur doit disposer des équipements et logiciels suivants :</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">1. Connexion Internet</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>Connexion internet stable avec un débit minimum recommandé de <strong>2 Mbps en réception</strong> et <strong>1 Mbps en émission</strong>.</li>
  <li>Pour les sessions en visioconférence : débit recommandé de <strong>5 Mbps</strong>.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">2. Navigateur Web récent</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li><strong>Google Chrome</strong> : version 80 ou supérieure</li>
  <li><strong>Mozilla Firefox</strong> : version 75 ou supérieure</li>
  <li><strong>Microsoft Edge</strong> : version 80 ou supérieure</li>
  <li><strong>Safari</strong> : version 13 ou supérieure</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">3. Logiciels requis</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li><strong>Lecteur PDF</strong> : Adobe Acrobat Reader ou équivalent (gratuit)</li>
  <li><strong>Lecteur vidéo</strong> : VLC Media Player ou équivalent</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">4. Adresse email</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>Une adresse email valide est obligatoire pour recevoir les communications de la plateforme.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">5. Matériel pour visioconférence</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li><strong>Microphone</strong> : fonctionnel pour participer aux échanges audio.</li>
  <li><strong>Webcam</strong> : recommandée pour les sessions interactives.</li>
</ul>

<div style="margin-top:1.5rem;padding:1rem;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0.25rem;">
  <p style="font-size:0.875rem;color:#92400e;">
    ⚠️ <strong>Important :</strong> L'utilisateur reconnaît que l'insuffisance de ses équipements techniques ne pourra en aucun cas engager la responsabilité de CB ACADEMY.
  </p>
</div>
`;

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
  const [submitted, setSubmitted] = useState(false);

  const [cguAccepted, setCguAccepted] = useState(false);
  const [prereqAccepted, setPrereqAccepted] = useState(false);
  const [showCguModal, setShowCguModal] = useState(false);
  const [showPrereqModal, setShowPrereqModal] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");

    if (!cguAccepted) {
      setError("Vous devez accepter les conditions générales d'utilisation.");
      return;
    }
    if (!prereqAccepted) {
      setError("Vous devez accepter les prérequis techniques.");
      return;
    }

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
          cguAccepted,
          prereqAccepted,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return setError(data.error || "Erreur inscription");
      }

      router.push("/login?registered=true");
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  // 🎨 STYLES
  const colors = {
    green: {
      light: "#ecfdf5",
      DEFAULT: "#059669",
      hover: "#047857",
      gradient: "linear-gradient(135deg, #059669, #10b981)",
    },
    orange: {
      light: "#fffbeb",
      DEFAULT: "#f59e0b",
      hover: "#d97706",
      text: "#92400e",
    },
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
    },
    border: "#e5e7eb",
    error: "#ef4444",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    border: `1px solid ${colors.border}`,
    borderRadius: "0.5rem",
    fontSize: "0.95rem",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    boxSizing: "border-box",
  };

  const inputFocusStyle = {
    borderColor: colors.green.DEFAULT,
    boxShadow: `0 0 0 3px rgba(5, 150, 105, 0.15)`,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ecfdf5, #fef3c7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1.5rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          maxWidth: "28rem",
          width: "100%",
          padding: "2rem",
        }}
      >
        {/* En-tête */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "800",
              background: colors.green.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            🎓 CB ACADEMY
          </h1>
          <p style={{ color: colors.orange.DEFAULT, fontWeight: "500", margin: "0.25rem 0 0" }}>
            Cheikh Bouamama Academy
          </p>
          <p style={{ color: colors.text.secondary, fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Créer votre compte
          </p>
        </div>

        {/* Erreur / Succès */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: colors.error,
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1.25rem",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginBottom: "0.75rem",
            }}
          >
            👨‍🎓 Élève
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input
              name="eleveNom"
              onChange={handleChange}
              placeholder="Nom de l'élève"
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            />
            <input
              name="elevePrenom"
              onChange={handleChange}
              placeholder="Prénom de l'élève"
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <select
            name="niveau"
            onChange={handleChange}
            required
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="">Choisir niveau</option>
            <option value="college">Collège</option>
            <option value="lycee">Lycée</option>
          </select>

          {form.niveau === "college" && (
            <select
              name="classe"
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">Classe</option>
              <option value="6eme">6ème</option>
              <option value="5eme">5ème</option>
              <option value="4eme">4ème</option>
              <option value="3eme">3ème</option>
            </select>
          )}

          {form.niveau === "lycee" && (
            <select
              name="classe"
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">Classe</option>
              <option value="1AS">1AS</option>
              <option value="2AS">2AS</option>
              <option value="Terminale">Terminale</option>
            </select>
          )}

          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginTop: "1.25rem",
              marginBottom: "0.75rem",
            }}
          >
            👨‍👩‍👦 Tuteur
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input
              name="tuteurNom"
              onChange={handleChange}
              placeholder="Nom tuteur"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            />
            <input
              name="tuteurPrenom"
              onChange={handleChange}
              placeholder="Prénom tuteur"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <input
            name="telephone"
            type="tel"
            onChange={handleChange}
            placeholder="Téléphone"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            name="email"
            type="email"
            onChange={handleChange}
            placeholder="Email"
            required
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            name="password"
            type="password"
            onChange={handleChange}
            placeholder="Mot de passe (min 6 caractères)"
            required
            minLength="6"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            name="confirmPassword"
            type="password"
            onChange={handleChange}
            placeholder="Confirmer mot de passe"
            required
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />

          {/* 🎨 POLITIQUES - STYLISÉES VERT & ORANGE */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: `2px solid ${colors.orange.light}`,
              background: colors.green.light,
              padding: "1.25rem",
              borderRadius: "0.75rem",
            }}
          >
            {/* CGU */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <input
                type="checkbox"
                id="cgu"
                checked={cguAccepted}
                onChange={(e) => setCguAccepted(e.target.checked)}
                style={{
                  marginTop: "0.2rem",
                  width: "1.25rem",
                  height: "1.25rem",
                  accentColor: colors.green.DEFAULT,
                  cursor: "pointer",
                  flexShrink: 0,
                  borderRadius: "0.25rem",
                }}
                required
              />
              <label
                htmlFor="cgu"
                style={{
                  fontSize: "0.8rem",
                  color: colors.text.primary,
                  lineHeight: "1.5",
                }}
              >
                Je déclare avoir pris connaissance des{" "}
                <button
                  type="button"
                  onClick={() => setShowCguModal(true)}
                  style={{
                    color: colors.green.DEFAULT,
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "inherit",
                    fontWeight: "500",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = colors.green.hover)}
                  onMouseLeave={(e) => (e.target.style.color = colors.green.DEFAULT)}
                >
                  conditions générales d'utilisation, de vente et de la politique de protection des données
                </button>{" "}
                à caractère personnel du CB ACADEMY et les accepte sans réserve.
                <span style={{ color: colors.error, marginLeft: "0.25rem" }}>*</span>
              </label>
            </div>
            {submitted && !cguAccepted && (
              <p
                style={{
                  color: colors.error,
                  fontSize: "0.75rem",
                  marginLeft: "2rem",
                  marginTop: "-0.25rem",
                }}
              >
                Vous devez accepter les conditions générales d'utilisation.
              </p>
            )}

            {/* Prérequis techniques */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <input
                type="checkbox"
                id="prereq"
                checked={prereqAccepted}
                onChange={(e) => setPrereqAccepted(e.target.checked)}
                style={{
                  marginTop: "0.2rem",
                  width: "1.25rem",
                  height: "1.25rem",
                  accentColor: colors.green.DEFAULT,
                  cursor: "pointer",
                  flexShrink: 0,
                  borderRadius: "0.25rem",
                }}
                required
              />
              <label
                htmlFor="prereq"
                style={{
                  fontSize: "0.8rem",
                  color: colors.text.primary,
                  lineHeight: "1.5",
                }}
              >
                Je déclare avoir pris connaissance des{" "}
                <button
                  type="button"
                  onClick={() => setShowPrereqModal(true)}
                  style={{
                    color: colors.green.DEFAULT,
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "inherit",
                    fontWeight: "500",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = colors.green.hover)}
                  onMouseLeave={(e) => (e.target.style.color = colors.green.DEFAULT)}
                >
                  prérequis techniques
                </button>{" "}
                liés à l'enseignement à distance et les accepte sans réserve.
                <span style={{ color: colors.error, marginLeft: "0.25rem" }}>*</span>
              </label>
            </div>
            {submitted && !prereqAccepted && (
              <p
                style={{
                  color: colors.error,
                  fontSize: "0.75rem",
                  marginLeft: "2rem",
                  marginTop: "-0.25rem",
                }}
              >
                Vous devez accepter les prérequis techniques.
              </p>
            )}
          </div>

          {/* 🎨 BOUTON D'INSCRIPTION */}
          <button
            type="submit"
            disabled={loading || !cguAccepted || !prereqAccepted}
            style={{
              marginTop: "1.5rem",
              width: "100%",
              padding: "0.85rem",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "1rem",
              fontWeight: "700",
              color: "white",
              background:
                !cguAccepted || !prereqAccepted
                  ? colors.text.secondary
                  : colors.green.gradient,
              cursor:
                !cguAccepted || !prereqAccepted ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s, background 0.3s",
              boxShadow:
                !cguAccepted || !prereqAccepted
                  ? "none"
                  : "0 4px 14px rgba(5, 150, 105, 0.35)",
            }}
            onMouseEnter={(e) => {
              if (cguAccepted && prereqAccepted && !loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(5, 150, 105, 0.45)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              if (cguAccepted && prereqAccepted && !loading) {
                e.target.style.boxShadow = "0 4px 14px rgba(5, 150, 105, 0.35)";
              }
            }}
          >
            {loading ? "⏳ Création en cours..." : "🚀 S'inscrire"}
          </button>
        </form>

        {/* Lien connexion */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: colors.text.secondary,
            marginTop: "1.5rem",
          }}
        >
          Déjà un compte ?{" "}
          <a
            href="/login"
            style={{
              color: colors.green.DEFAULT,
              fontWeight: "600",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = colors.green.hover)}
            onMouseLeave={(e) => (e.target.style.color = colors.green.DEFAULT)}
          >
            Se connecter
          </a>
        </p>
      </div>

      {/* Modales */}
      <PolicyModal
        isOpen={showCguModal}
        onClose={() => setShowCguModal(false)}
        title="📜 Conditions Générales d'Utilisation"
        content={CGU_CONTENT}
      />

      <PolicyModal
        isOpen={showPrereqModal}
        onClose={() => setShowPrereqModal(false)}
        title="💻 Prérequis Techniques"
        content={PREREQ_CONTENT}
      />
    </div>
  );
}