import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

export default function DashboardHeader({ user, roleIcon, customTitle }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", background: "white", padding: "1.5rem 2rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#2d3748" }}>{roleIcon} {customTitle || `مرحبًا ${user.prenom || user.nom || "المستخدم"} !`}</h1>
        <p style={{ color: "#718096", margin: "0.25rem 0 0", fontSize: "1rem" }}>{user.email}</p>
      </div>

      <div style={{ position: "relative" }} ref={dropdownRef}>
        <div 
          onClick={() => setOpen(!open)}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", background: "#f8fafc", padding: "8px 16px", borderRadius: "50px", border: "1px solid #e2e8f0", transition: "all 0.2s" }}
        >
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #17a9f1, #a3fdc4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "1.2rem", overflow: "hidden" }}>
            {user.photo ? (
              <img src={user.photo} alt="Profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user.prenom?.[0] || user.nom?.[0] || "👤"
            )}
          </div>
          <span style={{ fontWeight: "bold", color: "#4a5568" }}>الملف الشخصي</span>
          <span style={{ fontSize: "0.8rem", color: "#a0aec0", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
        </div>

        {open && (
          <div style={{ position: "absolute", top: "115%", right: 0, background: "white", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", width: "240px", overflow: "hidden", zIndex: 50, border: "1px solid #e2e8f0" }}>
            <button 
              onClick={() => router.push("/dashboard/profile")}
              style={{ width: "100%", padding: "14px 20px", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "0.95rem", color: "#4a5568", transition: "background 0.2s", display: "flex", gap: "10px", alignItems: "center" }}
              onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
              onMouseOut={(e) => e.currentTarget.style.background = "none"}
            >
              <span>👤</span> إكمال ملفك الشخصي
            </button>
            <button 
              onClick={() => router.push("/dashboard/settings/password")}
              style={{ width: "100%", padding: "14px 20px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "0.95rem", color: "#4a5568", transition: "background 0.2s", display: "flex", gap: "10px", alignItems: "center" }}
              onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
              onMouseOut={(e) => e.currentTarget.style.background = "none"}
            >
              <span>🔑</span> تغيير كلمة المرور
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
