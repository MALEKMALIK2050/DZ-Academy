import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        const data = await res.json();

        if (!active) return;

        setUser(res.ok ? data.user : null);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) {
          setLoading(false);
          setMenuOpen(false);
        }
      }
    };

    checkAuth();

    return () => {
      active = false;
    };
  }, [router.pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    router.push("/login");
  };

  const goToDashboard = () => {
    if (!user) return router.push("/login");
    router.push(`/dashboard/${user.role.toLowerCase()}`);
  };

  if (loading) return null;

  return (
    <header className="header">
      <div className="header-inner">

        <div className="nav-left">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            ☰ Menu
          </button>

          {menuOpen && (
            <div className="dropdown">
              <Link href="/">Accueil</Link>
              <Link href="/about">À propos</Link>
              <Link href="/contact">Contact</Link>
            </div>
          )}
        </div>

<div
  className="logo"
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    padding: "14px 0"
  }}
  onClick={() => window.location.href = "/"}
>
  <span
    style={{
      fontSize: "1.5rem",
      fontWeight: "700",
      whiteSpace: "nowrap",
      letterSpacing: "0.5px",
      color: "white",
      textShadow: "0 2px 8px rgba(0,0,0,0.25)"
    }}
  >
    🎓 Cheikh Bouamama Academy
  </span>

  <div
    style={{
      background: "rgba(255,255,255,0.12)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      padding: "14px",
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.15)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
    <img
      src="/logo.png"
      alt="Logo"
      style={{
        width: "90px",
        height: "90px",
        objectFit: "contain",
        opacity: 0.92,
        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.25))",
        flexShrink: 0
      }}
    />
  </div>
</div>



        <div className="nav-right">
  {!user ? (
    <>
      <Link href="/login" className="btn btn-login">
        Se connecter
      </Link>

      <Link href="/register" className="btn btn-register">
        S'inscrire
      </Link>
    </>
  ) : (
    <>
      <button className="btn btn-login" onClick={goToDashboard}>
        Dashboard
      </button>

      <button className="btn btn-register" onClick={handleLogout}>
        Déconnexion
      </button>
    </>
  )}
</div>

      </div>
    </header>
  );
}




