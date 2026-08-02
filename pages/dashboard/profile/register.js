// ======================================================
// FICHIER : pages/register.js (STYLISÉ VERT & ORANGE - VERSION ARABE)
// ======================================================

import { useState } from "react";
import { useRouter } from "next/router";
import PolicyModal from "@/components/PolicyModal";

// ✅ CONTENU DES POLITIQUES (traduit en arabe)
const CGU_CONTENT = `
<h3 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;">📜 الشروط العامة للاستخدام</h3>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">المادة 1 - مجال التطبيق</h4>
<p>تحكم هذه الشروط العامة للاستخدام الوصول إلى منصة CB ACADEMY واستخدامها، المتاحة على العنوان cb-academy-dz.vercel.app.</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">المادة 2 - قبول الشروط</h4>
<p>يعني التسجيل في المنصة القبول الكامل لهذه الشروط العامة للاستخدام. يقر المستخدم بأنه اطلع على الشروط العامة للاستخدام والبيع وسياسة حماية البيانات ذات الطابع الشخصي ويقبلها دون تحفظ.</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">المادة 3 - حماية البيانات الشخصية</h4>
<p>وفقًا للقانون الجزائري رقم 18-07 المؤرخ في 10 يونيو 2018 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة البيانات ذات الطابع الشخصي:</p>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>البيانات المجمّعة ضرورية بشكل صارم لإدارة التسجيلات والمتابعة البيداغوجية والاتصالات.</li>
  <li>يتمتع المستخدم بحق الوصول إلى بياناته وتصحيحها والاعتراض عليها.</li>
  <li>تُحفظ البيانات لمدة أقصاها 5 سنوات بعد آخر نشاط.</li>
  <li>تُطبَّق تدابير أمنية لحماية البيانات.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">المادة 4 - الملكية الفكرية</h4>
<p>المحتويات المتاحة على المنصة (الدروس، التمارين، الفيديوهات) محمية بحقوق التأليف والنشر. يُمنع أي نسخ أو نشر دون إذن.</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">المادة 5 - ميثاق الأساتذة</h4>
<p>يلتزم الأستاذ بما يلي:</p>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>استخدام المنصة بما يتوافق مع غايتها البيداغوجية.</li>
  <li>احترام سرية المعلومات المتعلقة بالتلاميذ.</li>
  <li>ضمان دقة ومشروعية المحتويات المنشورة.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">المادة 6 - ميثاق الطلاب وأولياء الأمور</h4>
<p>يلتزم الطالب وولي أمره بما يلي:</p>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>استخدام بيانات الدخول الخاصة بهم بشكل شخصي وسري.</li>
  <li>تبني سلوك محترم في فضاءات التواصل.</li>
  <li>عدم محاولة الالتفاف على إجراءات الأمان.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">المادة 7 - القانون المعمول به</h4>
<p>تخضع هذه الشروط العامة للقانون الجزائري. يعود الاختصاص في أي نزاع لمحاكم الجزائر العاصمة.</p>
`;

const PREREQ_CONTENT = `
<h3 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;">💻 المتطلبات التقنية</h3>

<p style="margin-bottom:1rem;">لمتابعة التكوينات على منصة CB ACADEMY، يجب على المستخدم توفير التجهيزات والبرامج التالية:</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">1. الاتصال بالإنترنت</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>اتصال إنترنت مستقر بسرعة دنيا موصى بها تبلغ <strong>2 ميغابت/ثانية للتنزيل</strong> و<strong>1 ميغابت/ثانية للرفع</strong>.</li>
  <li>لجلسات مؤتمرات الفيديو: سرعة موصى بها تبلغ <strong>5 ميغابت/ثانية</strong>.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">2. متصفح ويب حديث</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li><strong>Google Chrome</strong>: الإصدار 80 أو أحدث</li>
  <li><strong>Mozilla Firefox</strong>: الإصدار 75 أو أحدث</li>
  <li><strong>Microsoft Edge</strong>: الإصدار 80 أو أحدث</li>
  <li><strong>Safari</strong>: الإصدار 13 أو أحدث</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">3. البرامج المطلوبة</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li><strong>قارئ PDF</strong>: Adobe Acrobat Reader أو ما يعادله (مجاني)</li>
  <li><strong>مشغّل فيديو</strong>: VLC Media Player أو ما يعادله</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">4. عنوان بريد إلكتروني</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li>يُشترط وجود عنوان بريد إلكتروني صالح لتلقي اتصالات المنصة.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;">5. معدات مؤتمرات الفيديو</h4>
<ul style="list-style:disc;padding-left:1.5rem;margin-top:0.5rem;space-y:0.25rem;">
  <li><strong>ميكروفون</strong>: يعمل بشكل جيد للمشاركة في التبادلات الصوتية.</li>
  <li><strong>كاميرا ويب</strong>: يُنصح بها للجلسات التفاعلية.</li>
</ul>

<div style="margin-top:1.5rem;padding:1rem;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0.25rem;">
  <p style="font-size:0.875rem;color:#92400e;">
    ⚠️ <strong>هام:</strong> يقر المستخدم بأن عدم كفاية تجهيزاته التقنية لا يمكن أن يُحمّل بأي حال من الأحوال مسؤولية CB ACADEMY.
  </p>
</div>
`;

export default function RegisterStudent() {
  const router = useRouter();

  const [form, setForm] = useState({
    eleveNom: "",
    elevePrenom: "",
    niveau: "",
    classe: "",
    tuteurNom: "",
    tuteurPrenom: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [cguAccepted, setCguAccepted] = useState(false);
  const [prereqAccepted, setPrereqAccepted] = useState(false);
  const [showCguModal, setShowCguModal] = useState(false);
  const [showPrereqModal, setShowPrereqModal] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");

    if (!cguAccepted) {
      setError("يجب عليك قبول الشروط العامة للاستخدام.");
      return;
    }
    if (!prereqAccepted) {
      setError("يجب عليك قبول المتطلبات التقنية.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      return setError("كلمتا المرور غير متطابقتين");
    }

    if (form.password.length < 6) {
      return setError("كلمة المرور قصيرة جدًا (6 أحرف على الأقل)");
    }

    if (!form.niveau || !form.classe) {
      return setError("اختر الطور والقسم");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nom: form.eleveNom,
          prenom: form.elevePrenom,
          email: form.email,
          password: form.password,
          role: "student",
          niveau: form.niveau,
          classe: form.classe,
          tuteur: {
            nom: form.tuteurNom,
            prenom: form.tuteurPrenom,
            telephone: form.telephone,
          },
          cguAccepted,
          prereqAccepted,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return setError(data.error || "خطأ في التسجيل");
      }

      router.push("/login?registered=true");
    } catch {
      setError("خطأ في الخادم");
    } finally {
      setLoading(false);
    }
  };

  // 🎨 STYLES
  const colors = {
    green: {
      light: "#ecfdf5",
      DEFAULT: "#059669",
      hover: "#047857",
      gradient: "linear-gradient(135deg, #059669, #10b981)",
    },
    orange: {
      light: "#fffbeb",
      DEFAULT: "#f59e0b",
      hover: "#d97706",
      text: "#92400e",
    },
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
    },
    border: "#e5e7eb",
    error: "#ef4444",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    border: `1px solid ${colors.border}`,
    borderRadius: "0.5rem",
    fontSize: "0.95rem",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    boxSizing: "border-box",
  };

  const inputFocusStyle = {
    borderColor: colors.green.DEFAULT,
    boxShadow: `0 0 0 3px rgba(5, 150, 105, 0.15)`,
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ecfdf5, #fef3c7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1.5rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          maxWidth: "28rem",
          width: "100%",
          padding: "2rem",
        }}
      >
        {/* En-tête */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "800",
              background: colors.green.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            🎓 أكاديمية CB
          </h1>
          <p style={{ color: colors.orange.DEFAULT, fontWeight: "500", margin: "0.25rem 0 0" }}>
            أكاديمية الشيخ بوعمامة
          </p>
          <p style={{ color: colors.text.secondary, fontSize: "0.875rem", marginTop: "0.5rem" }}>
            إنشاء حسابك
          </p>
        </div>

        {/* Erreur / Succès */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: colors.error,
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1.25rem",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginBottom: "0.75rem",
            }}
          >
            👨‍🎓 التلميذ
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input
              name="eleveNom"
              onChange={handleChange}
              placeholder="لقب التلميذ"
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            />
            <input
              name="elevePrenom"
              onChange={handleChange}
              placeholder="اسم التلميذ"
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <select
            name="niveau"
            onChange={handleChange}
            required
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="">اختر الطور</option>
            <option value="college">المتوسط</option>
            <option value="lycee">الثانوي</option>
          </select>

          {form.niveau === "college" && (
            <select
              name="classe"
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">القسم</option>
              <option value="1AM">السنة الأولى متوسط</option>
              <option value="2AM">السنة الثانية متوسط</option>
              <option value="3AM">السنة الثالثة متوسط</option>
              <option value="4AM">السنة الرابعة متوسط</option>
            </select>
          )}

          {form.niveau === "lycee" && (
            <select
              name="classe"
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">القسم</option>
              <option value="1AS">السنة الأولى ثانوي</option>
              <option value="2AS">السنة الثانية ثانوي</option>
              <option value="3AS">السنة الثالثة ثانوي</option>
            </select>
          )}

          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginTop: "1.25rem",
              marginBottom: "0.75rem",
            }}
          >
            👨‍👩‍👦 ولي الأمر
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input
              name="tuteurNom"
              onChange={handleChange}
              placeholder="لقب ولي الأمر"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            />
            <input
              name="tuteurPrenom"
              onChange={handleChange}
              placeholder="اسم ولي الأمر"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <input
            name="telephone"
            type="tel"
            onChange={handleChange}
            placeholder="الهاتف"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            name="email"
            type="email"
            onChange={handleChange}
            placeholder="البريد الإلكتروني"
            required
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            name="password"
            type="password"
            onChange={handleChange}
            placeholder="كلمة المرور (6 أحرف على الأقل)"
            required
            minLength="6"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            name="confirmPassword"
            type="password"
            onChange={handleChange}
            placeholder="تأكيد كلمة المرور"
            required
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />

          {/* 🎨 POLITIQUES - STYLISÉES VERT & ORANGE */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: `2px solid ${colors.orange.light}`,
              background: colors.green.light,
              padding: "1.25rem",
              borderRadius: "0.75rem",
            }}
          >
            {/* CGU */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <input
                type="checkbox"
                id="cgu"
                checked={cguAccepted}
                onChange={(e) => setCguAccepted(e.target.checked)}
                style={{
                  marginTop: "0.2rem",
                  width: "1.25rem",
                  height: "1.25rem",
                  accentColor: colors.green.DEFAULT,
                  cursor: "pointer",
                  flexShrink: 0,
                  borderRadius: "0.25rem",
                }}
                required
              />
              <label
                htmlFor="cgu"
                style={{
                  fontSize: "0.8rem",
                  color: colors.text.primary,
                  lineHeight: "1.5",
                }}
              >
                أقر بأنني اطلعت على{" "}
                <button
                  type="button"
                  onClick={() => setShowCguModal(true)}
                  style={{
                    color: colors.green.DEFAULT,
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "inherit",
                    fontWeight: "500",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = colors.green.hover)}
                  onMouseLeave={(e) => (e.target.style.color = colors.green.DEFAULT)}
                >
                  الشروط العامة للاستخدام والبيع وسياسة حماية البيانات
                </button>{" "}
                ذات الطابع الشخصي لأكاديمية CB وأقبلها دون تحفظ.
                <span style={{ color: colors.error, marginLeft: "0.25rem" }}>*</span>
              </label>
            </div>
            {submitted && !cguAccepted && (
              <p
                style={{
                  color: colors.error,
                  fontSize: "0.75rem",
                  marginLeft: "2rem",
                  marginTop: "-0.25rem",
                }}
              >
                يجب عليك قبول الشروط العامة للاستخدام.
              </p>
            )}

            {/* Prérequis techniques */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <input
                type="checkbox"
                id="prereq"
                checked={prereqAccepted}
                onChange={(e) => setPrereqAccepted(e.target.checked)}
                style={{
                  marginTop: "0.2rem",
                  width: "1.25rem",
                  height: "1.25rem",
                  accentColor: colors.green.DEFAULT,
                  cursor: "pointer",
                  flexShrink: 0,
                  borderRadius: "0.25rem",
                }}
                required
              />
              <label
                htmlFor="prereq"
                style={{
                  fontSize: "0.8rem",
                  color: colors.text.primary,
                  lineHeight: "1.5",
                }}
              >
                أقر بأنني اطلعت على{" "}
                <button
                  type="button"
                  onClick={() => setShowPrereqModal(true)}
                  style={{
                    color: colors.green.DEFAULT,
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "inherit",
                    fontWeight: "500",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = colors.green.hover)}
                  onMouseLeave={(e) => (e.target.style.color = colors.green.DEFAULT)}
                >
                  المتطلبات التقنية
                </button>{" "}
                المرتبطة بالتعليم عن بعد وأقبلها دون تحفظ.
                <span style={{ color: colors.error, marginLeft: "0.25rem" }}>*</span>
              </label>
            </div>
            {submitted && !prereqAccepted && (
              <p
                style={{
                  color: colors.error,
                  fontSize: "0.75rem",
                  marginLeft: "2rem",
                  marginTop: "-0.25rem",
                }}
              >
                يجب عليك قبول المتطلبات التقنية.
              </p>
            )}
          </div>

          {/* 🎨 BOUTON D'INSCRIPTION */}
          <button
            type="submit"
            disabled={loading || !cguAccepted || !prereqAccepted}
            style={{
              marginTop: "1.5rem",
              width: "100%",
              padding: "0.85rem",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "1rem",
              fontWeight: "700",
              color: "white",
              background:
                !cguAccepted || !prereqAccepted
                  ? colors.text.secondary
                  : colors.green.gradient,
              cursor:
                !cguAccepted || !prereqAccepted ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s, background 0.3s",
              boxShadow:
                !cguAccepted || !prereqAccepted
                  ? "none"
                  : "0 4px 14px rgba(5, 150, 105, 0.35)",
            }}
            onMouseEnter={(e) => {
              if (cguAccepted && prereqAccepted && !loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(5, 150, 105, 0.45)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              if (cguAccepted && prereqAccepted && !loading) {
                e.target.style.boxShadow = "0 4px 14px rgba(5, 150, 105, 0.35)";
              }
            }}
          >
            {loading ? "⏳ جارٍ الإنشاء..." : "🚀 التسجيل"}
          </button>
        </form>

        {/* Lien connexion */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: colors.text.secondary,
            marginTop: "1.5rem",
          }}
        >
          لديك حساب بالفعل؟{" "}
          <a
            href="/login"
            style={{
              color: colors.green.DEFAULT,
              fontWeight: "600",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = colors.green.hover)}
            onMouseLeave={(e) => (e.target.style.color = colors.green.DEFAULT)}
          >
            تسجيل الدخول
          </a>
        </p>
      </div>

      {/* Modales */}
      <PolicyModal
        isOpen={showCguModal}
        onClose={() => setShowCguModal(false)}
        title="📜 الشروط العامة للاستخدام"
        content={CGU_CONTENT}
      />

      <PolicyModal
        isOpen={showPrereqModal}
        onClose={() => setShowPrereqModal(false)}
        title="💻 المتطلبات التقنية"
        content={PREREQ_CONTENT}
      />
    </div>
  );
}
