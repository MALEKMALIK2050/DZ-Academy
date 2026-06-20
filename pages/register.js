// ======================================================
// FICHIER : pages/register.js
// ======================================================
// MODIFICATIONS : Ajout des cases à cocher CGU + Prérequis techniques
//                 Ajout des modales pour afficher les politiques
//                 Vérification obligatoire avant soumission
// ======================================================

import { useState } from "react";
import { useRouter } from "next/router";
import PolicyModal from "@/components/PolicyModal";

// ✅ CONTENU DES POLITIQUES (à conserver ici)
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

  // ✅ ÉTAT POUR LES CASES À COCHER ET MODALES
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

    // ✅ VÉRIFICATION DES CASES À COCHER - OBLIGATOIRE
    if (!cguAccepted) {
      setError("Vous devez accepter les conditions générales d'utilisation.");
      return;
    }
    if (!prereqAccepted) {
      setError("Vous devez accepter les prérequis techniques.");
      return;
    }

    // Vérifications existantes
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
          // ✅ AJOUT - Envoi des consentements à l'API
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

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Inscription</h2>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <h3>👨‍🎓 Élève</h3>

          <input 
            name="eleveNom" 
            onChange={handleChange} 
            placeholder="Nom de l'élève" 
            required 
          />
          <input 
            name="elevePrenom" 
            onChange={handleChange} 
            placeholder="Prénom de l'élève" 
            required 
          />

          <select name="niveau" onChange={handleChange} required>
            <option value="">Choisir niveau</option>
            <option value="college">Collège</option>
            <option value="lycee">Lycée</option>
          </select>

          {form.niveau === "college" && (
            <select name="classe" onChange={handleChange} required>
              <option value="">Classe</option>
              <option value="6eme">6ème</option>
              <option value="5eme">5ème</option>
              <option value="4eme">4ème</option>
              <option value="3eme">3ème</option>
            </select>
          )}

          {form.niveau === "lycee" && (
            <select name="classe" onChange={handleChange} required>
              <option value="">Classe</option>
              <option value="1AS">1AS</option>
              <option value="2AS">2AS</option>
              <option value="Terminale">Terminale</option>
            </select>
          )}

          <h3>👨‍👩‍👦 Tuteur</h3>

          <input 
            name="tuteurNom" 
            onChange={handleChange} 
            placeholder="Nom tuteur" 
          />
          <input 
            name="tuteurPrenom" 
            onChange={handleChange} 
            placeholder="Prénom tuteur" 
          />
          <input 
            name="telephone" 
            onChange={handleChange} 
            placeholder="Téléphone" 
            type="tel"
          />

          <input 
            name="email" 
            type="email" 
            onChange={handleChange} 
            placeholder="Email" 
            required 
          />
          <input 
            name="password" 
            type="password" 
            onChange={handleChange} 
            placeholder="Mot de passe" 
            required 
            minLength="6"
          />
          <input 
            name="confirmPassword" 
            type="password" 
            onChange={handleChange} 
            placeholder="Confirmer mot de passe" 
            required 
          />

          {/* ✅ CASES À COCHER - POLITIQUES OBLIGATOIRES */}
          <div style={{ 
            marginTop: "1.5rem", 
            paddingTop: "1rem", 
            borderTop: "2px solid #e5e7eb" 
          }}>
            {/* CGU */}
            <div style={{ 
              display: "flex", 
              alignItems: "flex-start", 
              gap: "0.75rem",
              marginBottom: "0.75rem"
            }}>
              <input
                type="checkbox"
                id="cgu"
                checked={cguAccepted}
                onChange={(e) => setCguAccepted(e.target.checked)}
                style={{
                  marginTop: "0.25rem",
                  width: "1.25rem",
                  height: "1.25rem",
                  accentColor: "#059669",
                  cursor: "pointer",
                  flexShrink: 0
                }}
                required
              />
              <label htmlFor="cgu" style={{ fontSize: "0.875rem", color: "#374151", lineHeight: "1.5" }}>
                Je déclare avoir pris connaissance des{" "}
                <button
                  type="button"
                  onClick={() => setShowCguModal(true)}
                  style={{
                    color: "#2563eb",
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "inherit"
                  }}
                >
                  conditions générales d'utilisation, de vente et de la politique de protection des données
                </button>{" "}
                à caractère personnel du CB ACADEMY et les accepte sans réserve.
                <span style={{ color: "#ef4444", marginLeft: "0.25rem" }}>*</span>
              </label>
            </div>
            {submitted && !cguAccepted && (
              <p style={{ color: "#ef4444", fontSize: "0.8rem", marginLeft: "2rem", marginTop: "-0.25rem" }}>
                Vous devez accepter les conditions générales d'utilisation.
              </p>
            )}

            {/* Prérequis techniques */}
            <div style={{ 
              display: "flex", 
              alignItems: "flex-start", 
              gap: "0.75rem",
              marginBottom: "0.75rem"
            }}>
              <input
                type="checkbox"
                id="prereq"
                checked={prereqAccepted}
                onChange={(e) => setPrereqAccepted(e.target.checked)}
                style={{
                  marginTop: "0.25rem",
                  width: "1.25rem",
                  height: "1.25rem",
                  accentColor: "#059669",
                  cursor: "pointer",
                  flexShrink: 0
                }}
                required
              />
              <label htmlFor="prereq" style={{ fontSize: "0.875rem", color: "#374151", lineHeight: "1.5" }}>
                Je déclare avoir pris connaissance des{" "}
                <button
                  type="button"
                  onClick={() => setShowPrereqModal(true)}
                  style={{
                    color: "#2563eb",
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "inherit"
                  }}
                >
                  prérequis techniques
                </button>{" "}
                liés à l'enseignement à distance et les accepte sans réserve.
                <span style={{ color: "#ef4444", marginLeft: "0.25rem" }}>*</span>
              </label>
            </div>
            {submitted && !prereqAccepted && (
              <p style={{ color: "#ef4444", fontSize: "0.8rem", marginLeft: "2rem", marginTop: "-0.25rem" }}>
                Vous devez accepter les prérequis techniques.
              </p>
            )}
          </div>

          {/* ✅ BOUTON D'INSCRIPTION AVEC VÉRIFICATION */}
          <button 
            disabled={loading || !cguAccepted || !prereqAccepted}
            style={{
              marginTop: "1.5rem",
              width: "100%",
              padding: "0.75rem",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              color: "white",
              background: (!cguAccepted || !prereqAccepted) 
                ? "#9ca3af" 
                : "linear-gradient(135deg, #059669, #10b981)",
              cursor: (!cguAccepted || !prereqAccepted) 
                ? "not-allowed" 
                : "pointer",
              transition: "all 0.3s ease"
            }}
          >
            {loading ? "Création en cours..." : "S'inscrire"}
          </button>
        </form>
      </div>

      {/* ✅ MODALES DES POLITIQUES */}
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