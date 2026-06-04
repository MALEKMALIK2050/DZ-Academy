import { useState } from "react";

export default function Contact() {

  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // simulation envoi
    setSent(true);

    // reset après 3 sec
    setTimeout(() => {
      setSent(false);
    }, 3000);
  };

  return (
    <div className="contact-wrapper">
      <div className="contact-section">

        <h1>📩 Contact</h1>
        <p>Une question ? Écrivez-nous 👇</p>

        {/* MESSAGE SUCCESS */}
        {sent && (
          <div className="success-message">
            ✅ Message envoyé avec succès !
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Nom" required />
          <input type="email" placeholder="Email" required />
          <textarea placeholder="Ton message..." required />
          <button type="submit">Envoyer</button>
        </form>

      </div>
    </div>
  );
}