import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      return setMsg("❌ كلمتا المرور غير متطابقتين");
    }

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("✅ تم تحديث كلمة المرور!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMsg(`❌ ${data.error || "خطأ أثناء التحديث"}`);
      }
    } catch {
      setMsg("❌ خطأ في الخادم");
    }
    setLoading(false);
  };

  return (
    <ProtectedRoute>
      <div dir="rtl" lang="ar" style={{ maxWidth: "600px", margin: "3rem auto", background: "white", padding: "2rem", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <h1 style={{ marginBottom: "2rem", color: "#2d3748" }}>🔑 تغيير كلمة المرور</h1>
        
        {msg && <p style={{ padding: "1rem", background: msg.includes("✅") ? "#f0fff4" : "#fff5f5", color: msg.includes("✅") ? "green" : "red", borderRadius: "8px" }}>{msg}</p>}

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "#4a5568" }}>كلمة المرور الحالية</label>
          <input 
            type="password"
            value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} 
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "#4a5568" }}>كلمة المرور الجديدة</label>
          <input 
            type="password"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} 
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "#4a5568" }}>تأكيد كلمة المرور الجديدة</label>
          <input 
            type="password"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <button 
          onClick={handleSave} disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          style={{ width: "100%", background: "linear-gradient(135deg, #17a9f1, #0ea5e9)", color: "white", padding: "1rem", border: "none", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "bold", cursor: (loading || !currentPassword || !newPassword || !confirmPassword) ? "not-allowed" : "pointer", opacity: (loading || !currentPassword || !newPassword || !confirmPassword) ? 0.7 : 1 }}
        >
          {loading ? "جارٍ الحفظ..." : "تغيير كلمة المرور"}
        </button>
      </div>
    </ProtectedRoute>
  );
}
