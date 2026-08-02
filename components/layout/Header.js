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
    <header className="header" dir="rtl" lang="ar">
      <div className="header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 2rem' }}>

        {/* ═══ يمين: أزرار الدخول / التسجيل ═══ */}
        <div className="nav-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', gap: '0.75rem' }}>
          {!user ? (
            <>
              <Link href="/login" className="btn btn-login">
                الدخول
              </Link>
              <Link href="/register" className="btn btn-register">
                التسجيل
              </Link>
            </>
          ) : (
            <>
              <button className="btn btn-login" onClick={goToDashboard}>
                جدول القيادة
              </button>
              <button className="btn btn-register" onClick={handleLogout}>
                تسجيل الخروج
              </button>
            </>
          )}
        </div>

        {/* ═══ وسط: الشعار والخط العربي الفني ═══ */}
        <div
          className="logo-artistic-container"
          style={{
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: "1rem",
            cursor: "pointer",
            padding: "4px 8px"
          }}
          onClick={() => window.location.href = "/"}
        >
          {/* أيقونة الشعار في إطار كريستالي فاخر */}
          <div
            className="crystal-logo-frame"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 100%)",
              padding: "10px",
              borderRadius: "20px",
              border: "1.5px solid rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 0 16px 0 rgba(255, 255, 255, 0.4), 0 0 15px rgba(251, 191, 36, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.3s ease"
            }}
          >
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: "62px",
                height: "62px",
                objectFit: "contain",
                filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.3))"
              }}
            />
          </div>

          {/* النص الخطي الفني الموحد */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div
              className="arabic-title-artistic"
              style={{
                fontSize: "1.85rem",
                fontWeight: "700",
                lineHeight: "1.2",
                margin: "0",
                whiteSpace: "nowrap"
              }}
            >
              🎓 الأكاديمية الجزائرية
            </div>
            <div
              className="arabic-subtitle-artistic"
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                marginTop: "4px",
                color: "#FDE68A",
                whiteSpace: "nowrap",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
              }}
            >
              ✦ للتعليم الثانوي و المتوسط ✦
            </div>
          </div>
        </div>

        {/* ═══ يسار: قائمة التنقل ═══ */}
        <div className="nav-left" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            ☰ المحتوى
          </button>

          {menuOpen && (
            <div className="dropdown" style={{ position: 'absolute', top: '100%', left: 0 }}>
              <Link href="/">الرئيسية</Link>
              <Link href="/about">بخصوص الأكاديمية</Link>
              <Link href="/contact">تواصل معنا</Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}




