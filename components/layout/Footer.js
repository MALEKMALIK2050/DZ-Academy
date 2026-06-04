import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* ===== GAUCHE : Logo + Description + Réseaux sociaux ===== */}
        <div className="footer-left">
          <div className="footer-brand">
            🎓 Cheikh Bouamama Academy
          </div>
          <p className="footer-tagline">
            Plateforme éducative moderne pour les apprenants algériens 🇩🇿
          </p>

          {/* Réseaux sociaux */}
          <div className="footer-socials">
            <a href="https://facebook.com"  target="_blank" rel="noreferrer" aria-label="Facebook"  className="social-icon si-facebook">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="https://youtube.com"  target="_blank" rel="noreferrer" aria-label="YouTube"   className="social-icon si-youtube">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-icon si-instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://linkedin.com"  target="_blank" rel="noreferrer" aria-label="LinkedIn"  className="social-icon si-linkedin">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="https://t.me"          target="_blank" rel="noreferrer" aria-label="Telegram"  className="social-icon si-telegram">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>

        {/* ===== CENTRE : Navigation LMS ===== */}
        <div className="footer-center">
          <div className="footer-nav-group">
            <h4 className="footer-nav-title">Plateforme</h4>
            <Link href="/">Accueil</Link>
            <Link href="/courses">Catalogue des cours</Link>
            <Link href="/about">À propos</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="footer-nav-group">
            <h4 className="footer-nav-title">Apprendre</h4>
            <Link href="/register">S'inscrire</Link>
            <Link href="/login">Se connecter</Link>
            <Link href="/dashboard/student">Mon espace</Link>
            <Link href="/forum">Forum</Link>
          </div>
        </div>

        {/* ===== DROITE : Contact + Newsletter ===== */}
        <div className="footer-right">
          <h4 className="footer-nav-title">Nous contacter</h4>
          <div className="footer-contact-item">
            <span>📧</span>
            <span>contact@bouamama-academy.dz</span>
          </div>
          <div className="footer-contact-item">
            <span>📞</span>
            <span>+213 791 71 31 63</span>
          </div>
          <div className="footer-contact-item">
            <span>📍</span>
            <span>Algérie, Wilaya de Saïda</span>
          </div>

          <div className="footer-newsletter">
            <p>Restez informé des nouveaux cours :</p>
            <div className="newsletter-form">
              <input type="email" placeholder="votre@email.dz" aria-label="Email newsletter" />
              <button type="button" aria-label="S'abonner">→</button>
            </div>
          </div>
        </div>

      </div>

      {/* ===== BAS ===== */}
      <div className="footer-bottom">
        <span>© 2026 Cheikh Bouamama Academy — Apprendre devient fun 🚀</span>
        <div className="footer-bottom-links">
          <Link href="/privacy">Confidentialité</Link>
          <Link href="/terms">Conditions d'utilisation</Link>
          <Link href="/faq">FAQ</Link>
        </div>
      </div>
    </footer>
  );
}