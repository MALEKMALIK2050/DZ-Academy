// ======================================================
// FICHIER : pages/register.js — DZ ACADEMY (عربي / RTL)
// ======================================================

import { useState } from "react";
import { useRouter } from "next/router";
import PolicyModal from "@/components/PolicyModal";

// ✅ محتوى الشروط والأحكام بالعربية
const CGU_CONTENT = `
<h3 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;" dir="rtl">📜 الشروط العامة للاستخدام</h3>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">المادة 1 – نطاق التطبيق</h4>
<p dir="rtl">تنظّم هذه الشروط العامة للاستخدام الوصولَ إلى منصة دزأكاديمي والاستفادة منها، المتاحة على الرابط dzacademy.dz.</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">المادة 2 – قبول الشروط</h4>
<p dir="rtl">يعني التسجيل في المنصة القبولَ الكاملَ وغير المشروط لهذه الشروط العامة للاستخدام. يُقرّ المستخدم بأنه اطّلع على شروط الاستخدام وسياسة حماية البيانات الشخصية وقبلها دون تحفظ.</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">المادة 3 – حماية البيانات الشخصية</h4>
<p dir="rtl">وفقًا للقانون الجزائري رقم 18-07 المؤرخ في 10 يونيو 2018 المتعلق بحماية الأشخاص الطبيعيين في معالجة البيانات الشخصية:</p>
<ul style="list-style:disc;padding-right:1.5rem;margin-top:0.5rem;" dir="rtl">
  <li>البيانات المجمَّعة ضرورية حصرًا لإدارة التسجيل والمتابعة التربوية والتواصل.</li>
  <li>يحق للمستخدم الاطلاع على بياناته وتصحيحها والاعتراض عليها.</li>
  <li>تُحفظ البيانات لمدة أقصاها 5 سنوات بعد آخر نشاط.</li>
  <li>تُتّخذ تدابير أمنية لحماية البيانات.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">المادة 4 – الملكية الفكرية</h4>
<p dir="rtl">المحتويات المتاحة على المنصة (دروس، تمارين، مقاطع فيديو) محمية بحقوق المؤلف. يُحظر أي نسخ أو نشر دون إذن مسبق.</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">المادة 5 – ميثاق الأساتذة</h4>
<p dir="rtl">يلتزم الأستاذ بما يلي:</p>
<ul style="list-style:disc;padding-right:1.5rem;margin-top:0.5rem;" dir="rtl">
  <li>استخدام المنصة وفق أهدافها التربوية.</li>
  <li>احترام سرية المعلومات المتعلقة بالتلاميذ.</li>
  <li>ضمان دقة المحتويات المنشورة ومشروعيتها.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">المادة 6 – ميثاق التلاميذ وأولياء الأمور</h4>
<p dir="rtl">يلتزم التلميذ وأولياء أموره بما يلي:</p>
<ul style="list-style:disc;padding-right:1.5rem;margin-top:0.5rem;" dir="rtl">
  <li>استخدام بيانات الدخول بصفة شخصية وسرية.</li>
  <li>التحلّي باحترام في فضاءات التواصل.</li>
  <li>عدم محاولة تجاوز إجراءات الأمان.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">المادة 7 – القانون المطبّق</h4>
<p dir="rtl">تخضع هذه الشروط للقانون الجزائري. يختص القضاء الجزائري بالفصل في أي نزاع.</p>
`;

const PREREQ_CONTENT = `
<h3 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;" dir="rtl">💻 المتطلبات التقنية</h3>

<p style="margin-bottom:1rem;" dir="rtl">لمتابعة الدروس على منصة دزأكاديمي، يجب أن يمتلك المستخدم المعدات والبرامج التالية:</p>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">1. اتصال بالإنترنت</h4>
<ul style="list-style:disc;padding-right:1.5rem;margin-top:0.5rem;" dir="rtl">
  <li>اتصال مستقر بسرعة استقبال لا تقل عن <strong>2 ميغابت/ث</strong> وإرسال لا تقل عن <strong>1 ميغابت/ث</strong>.</li>
  <li>لجلسات الفيديو التفاعلية: يُنصح بسرعة <strong>5 ميغابت/ث</strong>.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">2. متصفح حديث</h4>
<ul style="list-style:disc;padding-right:1.5rem;margin-top:0.5rem;" dir="rtl">
  <li><strong>Google Chrome</strong>: الإصدار 80 أو أحدث</li>
  <li><strong>Mozilla Firefox</strong>: الإصدار 75 أو أحدث</li>
  <li><strong>Microsoft Edge</strong>: الإصدار 80 أو أحدث</li>
  <li><strong>Safari</strong>: الإصدار 13 أو أحدث</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">3. البرامج المطلوبة</h4>
<ul style="list-style:disc;padding-right:1.5rem;margin-top:0.5rem;" dir="rtl">
  <li><strong>قارئ PDF</strong>: Adobe Acrobat Reader أو ما يعادله (مجاني)</li>
  <li><strong>مشغّل فيديو</strong>: VLC Media Player أو ما يعادله</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">4. البريد الإلكتروني</h4>
<ul style="list-style:disc;padding-right:1.5rem;margin-top:0.5rem;" dir="rtl">
  <li>عنوان بريد إلكتروني صالح إلزامي لاستقبال مراسلات المنصة.</li>
</ul>

<h4 style="font-weight:600;margin-top:1rem;margin-bottom:0.5rem;" dir="rtl">5. معدات الفيديو التفاعلي</h4>
<ul style="list-style:disc;padding-right:1.5rem;margin-top:0.5rem;" dir="rtl">
  <li><strong>ميكروفون</strong>: يشترط أن يكون سليمًا للمشاركة الصوتية.</li>
  <li><strong>كاميرا ويب</strong>: مُستحسَنة للجلسات التفاعلية.</li>
</ul>

<div style="margin-top:1.5rem;padding:1rem;background:#fffbeb;border-right:4px solid #f59e0b;border-radius:0.25rem;" dir="rtl">
  <p style="font-size:0.875rem;color:#92400e;">
    ⚠️ <strong>تنبيه:</strong> يُقرّ المستخدم بأن قصور معداته التقنية لا يمكن بأي حال أن يُعدّ مسؤولية المنصة.
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
      setError("يجب قبول الشروط العامة للاستخدام.");
      return;
    }
    if (!prereqAccepted) {
      setError("يجب قبول المتطلبات التقنية.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      return setError("كلمتا المرور غير متطابقتين");
    }

    if (form.password.length < 6) {
      return setError("كلمة المرور قصيرة جدًا (6 أحرف على الأقل)");
    }

    if (!form.niveau || !form.classe) {
      return setError("يرجى اختيار الطور والسنة الدراسية");
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

  // 🎨 الألوان
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
    direction: "rtl",
    textAlign: "right",
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
        fontFamily: "'Cairo', 'Tajawal', system-ui, sans-serif",
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
        {/* الترويسة */}
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
            🎓 دزأكاديمي
          </h1>
          <p style={{ color: colors.orange.DEFAULT, fontWeight: "500", margin: "0.25rem 0 0" }}>
            الأكاديمية الجزائرية للتعليم
          </p>
          <p style={{ color: colors.text.secondary, fontSize: "0.875rem", marginTop: "0.5rem" }}>
            إنشاء حسابك
          </p>
        </div>

        {/* رسالة خطأ */}
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
              textAlign: "right",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* قسم التلميذ */}
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginBottom: "0.75rem",
              textAlign: "right",
            }}
          >
            👨‍🎓 بيانات التلميذ
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input
              name="eleveNom"
              onChange={handleChange}
              placeholder="اللقب"
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
              placeholder="الاسم"
              required
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* اختيار الطور */}
          <select
            name="niveau"
            onChange={handleChange}
            required
            style={{ ...inputStyle, marginTop: "0.75rem" }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="">اختر الطور التعليمي</option>
            <option value="college">التعليم المتوسط</option>
            <option value="lycee">التعليم الثانوي</option>
          </select>

          {/* سنوات المتوسط */}
          {form.niveau === "college" && (
            <select
              name="classe"
              onChange={handleChange}
              required
              style={{ ...inputStyle, marginTop: "0.75rem" }}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">اختر السنة الدراسية</option>
              <option value="السنة الأولى متوسط">السنة الأولى متوسط</option>
              <option value="السنة الثانية متوسط">السنة الثانية متوسط</option>
              <option value="السنة الثالثة متوسط">السنة الثالثة متوسط</option>
              <option value="السنة الرابعة متوسط">السنة الرابعة متوسط</option>
            </select>
          )}

          {/* سنوات الثانوي */}
          {form.niveau === "lycee" && (
            <select
              name="classe"
              onChange={handleChange}
              required
              style={{ ...inputStyle, marginTop: "0.75rem" }}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">اختر السنة الدراسية</option>
              <option value="السنة الأولى ثانوي">السنة الأولى ثانوي</option>
              <option value="السنة الثانية ثانوي">السنة الثانية ثانوي</option>
              <option value="السنة الثالثة ثانوي">السنة الثالثة ثانوي (بكالوريا)</option>
            </select>
          )}

          {/* قسم الولي */}
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginTop: "1.25rem",
              marginBottom: "0.75rem",
              textAlign: "right",
            }}
          >
            👨‍👩‍👦 بيانات ولي الأمر
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input
              name="tuteurNom"
              onChange={handleChange}
              placeholder="لقب الولي"
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
              placeholder="اسم الولي"
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
            placeholder="رقم الهاتف"
            style={{ ...inputStyle, marginTop: "0.75rem" }}
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
            style={{ ...inputStyle, marginTop: "0.75rem" }}
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
            style={{ ...inputStyle, marginTop: "0.75rem" }}
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
            style={{ ...inputStyle, marginTop: "0.75rem" }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />

          {/* 📋 الشروط والمتطلبات */}
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
            {/* الشروط العامة */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                marginBottom: "0.75rem",
                flexDirection: "row-reverse",
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
                  textAlign: "right",
                }}
              >
                أُقرّ بأنني اطّلعت على{" "}
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
                  الشروط العامة للاستخدام وسياسة حماية البيانات الشخصية
                </button>{" "}
                لمنصة دزأكاديمي وأقبلها دون تحفظ.
                <span style={{ color: colors.error, marginRight: "0.25rem" }}>*</span>
              </label>
            </div>
            {submitted && !cguAccepted && (
              <p
                style={{
                  color: colors.error,
                  fontSize: "0.75rem",
                  marginRight: "2rem",
                  marginTop: "-0.25rem",
                  textAlign: "right",
                }}
              >
                يجب قبول الشروط العامة للاستخدام.
              </p>
            )}

            {/* المتطلبات التقنية */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                marginBottom: "0.75rem",
                flexDirection: "row-reverse",
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
                  textAlign: "right",
                }}
              >
                أُقرّ بأنني اطّلعت على{" "}
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
                للتعليم عن بُعد وأقبلها دون تحفظ.
                <span style={{ color: colors.error, marginRight: "0.25rem" }}>*</span>
              </label>
            </div>
            {submitted && !prereqAccepted && (
              <p
                style={{
                  color: colors.error,
                  fontSize: "0.75rem",
                  marginRight: "2rem",
                  marginTop: "-0.25rem",
                  textAlign: "right",
                }}
              >
                يجب قبول المتطلبات التقنية.
              </p>
            )}
          </div>

          {/* 🚀 زر التسجيل */}
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
              fontFamily: "inherit",
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
            {loading ? "⏳ جارٍ إنشاء الحساب..." : "🚀 التسجيل"}
          </button>
        </form>

        {/* رابط تسجيل الدخول */}
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

      {/* النوافذ المنبثقة */}
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