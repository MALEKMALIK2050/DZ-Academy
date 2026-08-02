import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "cba_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(CONSENT_KEY);
      if (!existing) setVisible(true);
    } catch {
      // localStorage indisponible
    }
  }, []);

  const setConsent = (value) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, date: new Date().toISOString() }));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "24px",
        zIndex: 2000,
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        padding: "1.5rem",
        maxWidth: "450px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ margin: 0, fontSize: "1rem", color: "#1e293b", lineHeight: 1.5, fontWeight: "500" }}>
          🍪 Gestion des cookies
        </p>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569", lineHeight: 1.5 }}>
          Nous utilisons des cookies strictement nécessaires au fonctionnement de la plateforme, ainsi que
          des cookies optionnels pour améliorer votre expérience. Consultez notre{" "}
          <Link href="/cookies" style={{ color: "#059669", fontWeight: "700" }}>
            Politique de Cookies
          </Link>.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            onClick={() => setConsent("essential_only")}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              border: "1px solid #cbd5e0",
              background: "white",
              color: "#475569",
              fontWeight: "700",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Refuser
          </button>
          <button
            onClick={() => setConsent("all")}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "white",
              fontWeight: "700",
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(5, 150, 105, 0.2)",
            }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
