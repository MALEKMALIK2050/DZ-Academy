import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ ما");
        return;
      }

      setMessage("تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.");
      
      // Optionnel: Rediriger vers la page de login après quelques secondes
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err) {
      console.error(err);
      setError("خطأ في الخادم");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div dir="rtl" lang="ar" className="auth-wrapper">
        <div className="auth-container">
          <h2>رابط غير صالح</h2>
          <p className="error">رابط إعادة التعيين مفقود أو غير صالح.</p>
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link href="/login" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}>
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" className="auth-wrapper">
      <div className="auth-container">
        <h2>كلمة مرور جديدة</h2>
        <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "#666" }}>
          يرجى إدخال كلمة المرور الجديدة الخاصة بك.
        </p>

        {message ? (
          <div>
            <p style={{ color: "#059669", fontWeight: "600", marginBottom: "1rem" }}>{message}</p>
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <Link href="/login" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}>
                الذهاب إلى صفحة تسجيل الدخول
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}

            <input
              name="password"
              type="password"
              placeholder="كلمة المرور الجديدة"
              value={form.password}
              onChange={handleChange}
              required
            />

            <input
              name="confirmPassword"
              type="password"
              placeholder="تأكيد كلمة المرور"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "جارٍ إعادة التعيين..." : "حفظ كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
