import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ ما");
        return;
      }

      setMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.");
    } catch (err) {
      console.error(err);
      setError("خطأ في الخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" lang="ar" className="auth-wrapper">
      <div className="auth-container">
        <h2>نسيت كلمة المرور؟</h2>
        <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "#666", textAlign: "right" }}>
          أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
        </p>

        {message && (
          <p style={{ color: "#059669", fontWeight: "600", marginBottom: "1rem", textAlign: "right" }}>
            ✅ {message}
          </p>
        )}
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="بريدك الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "جارٍ الإرسال..." : "إرسال الرابط"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link href="/login" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}>
            العودة إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
