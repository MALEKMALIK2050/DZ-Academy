import React, { useEffect, useState } from 'react';

export default function About() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="about-page-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        .about-page-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 180px);
          padding: 40px 20px;
          background: transparent;
        }

        .about-card {
          max-width: 850px;
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          padding: 60px 50px;
          border-radius: 30px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.1);
          text-align: center;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .about-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .about-card::before {
          content: "";
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, transparent 60%);
          animation: spin 15s linear infinite;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .about-content {
          position: relative;
          z-index: 1;
        }

        .about-icon {
          font-size: 55px;
          margin-bottom: 20px;
          display: inline-block;
          animation: floatIcon 3s ease-in-out infinite;
        }

        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .about-title {
          font-size: 42px;
          font-weight: 800;
          color: #065f46;
          margin-bottom: 30px;
          letter-spacing: -0.5px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s ease 0.2s;
        }

        .about-card.visible .about-title {
          opacity: 1;
          transform: translateY(0);
        }

        .about-text {
          font-size: 19px;
          line-height: 1.7;
          color: #1a1d20ff;
          margin-bottom: 25px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s ease;
        }

        .about-card.visible .about-text {
          opacity: 1;
          transform: translateY(0);
        }

        .about-card.visible .about-text:nth-child(1) { transition-delay: 0.3s; }
        .about-card.visible .about-text:nth-child(2) { transition-delay: 0.4s; }
        .about-card.visible .about-text:nth-child(3) { transition-delay: 0.5s; }

        .about-vision-box {
          margin-top: 50px;
          padding: 35px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-left: 6px solid #22c55e;
          border-radius: 20px;
          opacity: 0;
          transform: scale(0.95);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s;
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.1);
        }

        .about-card.visible .about-vision-box {
          opacity: 1;
          transform: scale(1);
        }

        .about-vision-box:hover {
          transform: scale(1.02);
          transition: transform 0.3s ease;
        }

        .about-vision-title {
          font-size: 26px;
          font-weight: 700;
          color: #047857;
          margin-bottom: 15px;
        }

        .about-vision-text {
          font-size: 20px;
          font-style: italic;
          color: #030910ca;
          margin: 0;
        }

        @media (max-width: 768px) {
          .about-card { padding: 40px 25px; }
          .about-title { font-size: 32px; }
          .about-text { font-size: 17px; }
          .about-vision-box { padding: 25px; }
        }
      `}} />

      <div className={`about-card ${mounted ? 'visible' : ''}`}>
        <div className="about-content">
          <div className="about-icon">🎓</div>

          <h1 className="about-title">
            À propos de Cheikh Bouamama Academy
          </h1>

          <div>
            <p className="about-text">
              <strong>Cheikh Bouamama Academy</strong> est une plateforme d’enseignement en ligne dédiée aux élèves du collège et du lycée.
            </p>

            <p className="about-text">
              Notre mission est de rendre l’éducation accessible, moderne et adaptée au rythme de chaque élève.
            </p>

            <p className="about-text">
              Nous travaillons avec des enseignants qualifiés pour offrir des cours structurés, clairs et efficaces.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">Notre vision</h2>
            <p className="about-vision-text">
              "Accompagner chaque élève vers la réussite scolaire grâce à des outils numériques performants et un suivi personnalisé."
            </p>
          </div>

          <div className="about-vision-box" style={{ marginTop: '40px' }}>
            <h2 className="about-vision-title">Nos programmes d’enseignement 📚</h2>
            <p className="about-text" style={{ fontSize: '18px' }}>
              Cheikh Bouamama Academy propose un accompagnement complet pour les élèves du collège et du lycée, avec des contenus pédagogiques adaptés aux programmes officiels et aux besoins de chaque niveau.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">Objectifs pédagogiques</h2>
            <p className="about-text" style={{ fontSize: '16px' }}>
              Notre objectif est d’aider chaque élève à maîtriser les fondamentaux, développer son autonomie et améliorer ses performances scolaires grâce à une méthode structurée et progressive.
            </p>
            <p className="about-text" style={{ fontSize: '16px', marginTop: '10px' }}>
              Nous mettons l’accent sur la compréhension, la pratique et la régularité afin de garantir une progression réelle et durable.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">Disciplines proposées</h2>
            <p className="about-text" style={{ fontSize: '16px' }}>
              Nos cours couvrent les principales matières du collège et du lycée :
            </p>
            <p className="about-text" style={{ fontSize: '18px', fontWeight: '800', color: '#065f46', marginTop: '10px' }}>
              Mathématiques, Physique, Sciences naturelles, Langue arabe, Français et Anglais.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">Notre méthode</h2>
            <p className="about-text" style={{ fontSize: '16px' }}>
              Chaque cours est conçu pour permettre à l’élève d’apprendre à son rythme, grâce à une approche basée sur l’autoformation guidée.
            </p>
            <p className="about-text" style={{ fontSize: '16px', marginTop: '10px' }}>
              Les leçons sont claires, progressives et accompagnées d’exemples concrets pour faciliter la compréhension.
            </p>
            <p className="about-text" style={{ fontSize: '16px', marginTop: '10px' }}>
              Des exercices pratiques sont proposés après chaque module afin de renforcer les acquis et permettre à l’élève de s’entraîner efficacement.
            </p>
            <p className="about-text" style={{ fontSize: '16px', marginTop: '10px' }}>
              À la fin de chaque parcours, un test d’évaluation permet de mesurer le niveau de maîtrise et de valider les compétences acquises.
            </p>
          </div>

          <div className="about-vision-box">
            <h2 className="about-vision-title">Un enseignement complet</h2>
            <p className="about-text" style={{ fontSize: '16px' }}>
              Grâce à notre méthode, l’élève devient acteur de son apprentissage, gagne en confiance et progresse de manière autonome vers la réussite souhaitée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}