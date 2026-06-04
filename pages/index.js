import Link from "next/link";
import { useState } from "react";
import AnimatedLogo from "../components/AnimatedLogo";

export default function Home() {

  const [index, setIndex] = useState(0);

  const items = [
    { title: "🤝 Pédagogie collaborative", text: "Travailler en groupe est le moyen le plus efficace pour apprendre" },
    { title: "🧘 Autonomie", text: "Boostez votre motivation pour développer votre détermination à apprendre" },
    { title: "📚 Cours interactifs", text: "Apprenez facilement avec des leçons simples et adaptées" },
    { title: "🎯 Exercices", text: "Testez vos connaissances périodiquement" },
    { title: "🏆 Progression", text: "Suivez votre évolution et réalisez vos objectifs" }
  ];

  return (
    <>

      {/* HERO */}
      <section className="hero">
        <h1>📚 Apprenez autrement</h1>
        <h2>Des cours simples, fun et efficaces</h2>
        <h2>Les professionnels de l'enseignement à distance vous prennent en charge</h2>
        <br />

        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>

          <Link href="/about" className="btn btn-login">
            🤝 Notre engagement
          </Link>

          <Link href="/register" className="btn btn-register">
            🚀 S'inscrire maintenant
          </Link>

        </div>

      </section>

      {/* CAROUSEL 3D */}
      <section className="carousel">

        <div className="carousel-container">

          {items.map((item, i) => {
            const position = (i - index + items.length) % items.length;

            return (
              <div
                key={i}
                className={`carousel-card pos-${position}`}
                onClick={() => setIndex(i)}
              >
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            );
          })}

        </div>

      </section>

    </>
  );
}

