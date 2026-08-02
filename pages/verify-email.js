import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function VerifyEmail() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const token = router.query.token;
    if (!token) return;

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [router.query]);

  if (status === "loading") {
    return (
      <div dir="rtl" lang="ar" style={wrapperStyle}>
        <h2 style={{ color: "#059669" }}>⏳ جارٍ التحقق من حسابك...</h2>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div dir="rtl" lang="ar" style={wrapperStyle}>
        <h2 style={{ color: "#059669" }}>✅ تم تفعيل الحساب بنجاح!</h2>
        <p style={{ color: "#4b5563", marginTop: "0.5rem" }}>يمكنك الآن تسجيل الدخول.</p>
        <a href="/login" style={linkStyle}>الذهاب إلى صفحة تسجيل الدخول</a>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" style={wrapperStyle}>
      <h2 style={{ color: "#dc2626" }}>❌ خطأ في التحقق</h2>
      <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>الرابط غير صالح أو منتهي الصلاحية.</p>
      <a href="/register" style={{ ...linkStyle, color: "#dc2626" }}>حاول التسجيل مرة أخرى</a>
    </div>
  );
}

const wrapperStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Cairo', 'Tajawal', system-ui, sans-serif",
  textAlign: "center",
  padding: "2rem",
};

const linkStyle = {
  display: "inline-block",
  marginTop: "1.5rem",
  padding: "0.75rem 1.5rem",
  background: "linear-gradient(135deg, #059669, #10b981)",
  color: "white",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "700",
  fontSize: "0.95rem",
};
