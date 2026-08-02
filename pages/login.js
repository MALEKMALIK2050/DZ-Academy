import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Gérer les messages de l'URL
  useState(() => {
    if (router.query.verified === "true") {
      setSuccess("✅ تم تفعيل الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
    }
    if (router.query.error === "token_invalide") {
      setError("❌ رابط التفعيل غير صالح أو منتهي الصلاحية.");
    }
    if (router.query.error === "Compte désactivé") {
      setError("⏳ يرجى تفعيل حسابك عبر البريد الإلكتروني المُستلم.");
    }
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطأ في تسجيل الدخول");
        return;
      }

      if (data.success) {
        const role = data.user?.role?.toLowerCase();

        if (role) {
          router.replace(`/dashboard/${role}`);
        } else {
          router.replace("/");
        }
      }
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
        <h2>تسجيل الدخول</h2>

        {success && <p style={{ color: "#059669", fontWeight: "600", marginBottom: "1rem" }}>{success}</p>}
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="البريد الإلكتروني"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="كلمة المرور"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div style={{ textAlign: "start", marginBottom: "1rem" }}>
            <Link href="/forgot-password" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}>
              نسيت كلمة المرور؟
            </Link>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
