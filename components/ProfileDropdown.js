import React, { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

const ROLE_LABELS = {
  STUDENT: "طالب",
  TEACHER: "أستاذ",
  DESIGNER: "مصمم",
  ADMIN: "مدير",
};

export default function ProfileDropdown({ userRole }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const roleLabel = ROLE_LABELS[userRole?.toUpperCase()] || userRole;

  return (
    <div dir="rtl" lang="ar" style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#f97316",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "0.875rem",
          fontWeight: "500",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ea580c"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f97316"}
      >
        <span>👤</span>
        <span>{user?.prenom || user?.nom || "المدير"}</span>
        <span style={{ fontSize: "0.75rem" }}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "0.5rem",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            minWidth: "220px",
            zIndex: 999,
            overflow: "hidden"
          }}>
            <div style={{ 
              padding: "1rem", 
              borderBottom: "1px solid #e2e8f0",
              backgroundColor: "#fef3c7"
            }}>
              <p style={{ margin: 0, fontWeight: "600", color: "#1e293b" }}>
                {user?.prenom} {user?.nom}
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.7rem", color: "#f97316" }}>
                {roleLabel}
              </p>
            </div>
            
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/profile");
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem 1rem",
                textAlign: "right",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: "#1e293b",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              ⚙️ ملفي الشخصي
            </button>
            
            <button
              onClick={handleLogout}
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem 1rem",
                textAlign: "right",
                backgroundColor: "transparent",
                border: "none",
                borderTop: "1px solid #e2e8f0",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: "#ef4444",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              🚪 تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
}