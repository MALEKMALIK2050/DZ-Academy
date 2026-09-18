import { useState, useEffect } from "react";

const WHATSAPP_NUMBER = "213791713163"; // رقم الواتساب
const PAYMENT_INFO = {
  ccp: {
    numero: "XXXXXXXX XX",
    cle: "XX",
    titulaire: "الاسم واللقب",
  },
  rib: {
    banque: "اسم البنك",
    numero: "XXX XXX XXXXXXXXXXXX XX",
    titulaire: "الاسم واللقب",
  },
};

export default function CataloguePaymentModal({ isOpen, onClose, course, typePaiement, onConfirm }) {
  const [preuveFile, setPreuveFile] = useState(null);
  const [preuvePreview, setPreuvePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // إعادة تعيين الحالة عند الفتح/الإغلاق
  useEffect(() => {
    if (isOpen) {
      setPreuveFile(null);
      setPreuvePreview(null);
      setIsSending(false);
    }
  }, [isOpen]);

  if (!isOpen || !course) return null;

  // حساب السعر بنفس شروط academy
  const isParcours = typePaiement === "PARCOURS_COMPLET";
  const prixBase = course.prix === 0 ? 0 : (course.prix ?? 500);
  const parcoursTotal = (course.parcoursTotalPrice !== undefined && course.parcoursTotalPrice !== null)
    ? course.parcoursTotalPrice
    : (prixBase > 0 ? prixBase * 4 : 2000);
  const prixReel = isParcours ? Math.round(parcoursTotal * 0.75) : prixBase;
  const libelle = isParcours ? `المسار الكامل (${course.matiere} ${course.annee || ""})` : course.title;

  const handlePreuveSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("صيغة الملف غير مدعومة. يرجى استخدام صورة (JPEG, PNG, WebP, GIF) أو ملف PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("حجم الملف كبير جداً (الحد الأقصى 10 ميغابايت).");
      return;
    }

    setPreuveFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreuvePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreuvePreview(null);
    }
  };

  const handleSubmit = async () => {
    setIsSending(true);
    try {
      await onConfirm(course.id, typePaiement, preuveFile);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", zIndex: 1000,
        direction: "rtl"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: "16px", padding: "1.75rem",
          maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          direction: "rtl", textAlign: "right"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#1f2937", margin: 0 }}>
            💳 تعليمات الدفع وتأكيد الطلب
          </h2>
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>
          الطلب : <strong>{libelle}</strong>
          {isParcours && <span style={{ color: "#d97706", marginRight: "0.5rem", fontWeight: "700" }}>(تم تطبيق خصم 25% 🎉)</span>}
        </p>

        <div style={{
          background: prixReel ? "#eff6ff" : "#ecfdf5",
          color: prixReel ? "#1e40af" : "#059669",
          padding: "0.85rem 1rem", borderRadius: "12px",
          fontWeight: "800", fontSize: "1.15rem", marginBottom: "1.25rem", textAlign: "center",
          border: `1.5px solid ${prixReel ? "#bfdbfe" : "#a7f3d0"}`
        }}>
          {prixReel > 0
            ? `المبلغ المطلوب للدفع : ${prixReel.toLocaleString("fr-FR")} د.ج`
            : "هذا الدرس مجاني — لا يتطلب أي دفع"}
        </div>

        {prixReel > 0 && (
          <>
            {/* CCP */}
            <div style={{ marginBottom: "1rem", padding: "1rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontWeight: "700", color: "#1e293b", marginBottom: "0.5rem" }}>📮 الدفع عبر بريد الجزائر (CCP / BaridiMob)</p>
              <p style={{ fontSize: "0.88rem", color: "#475569", margin: "0.2rem 0" }}>رقم الحساب : <strong>{PAYMENT_INFO.ccp.numero}</strong> المفتاح : <strong>{PAYMENT_INFO.ccp.cle}</strong></p>
              <p style={{ fontSize: "0.88rem", color: "#475569", margin: "0.2rem 0" }}>صاحب الحساب : <strong>{PAYMENT_INFO.ccp.titulaire}</strong></p>
            </div>

            {/* Banque */}
            <div style={{ marginBottom: "1.25rem", padding: "1rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontWeight: "700", color: "#1e293b", marginBottom: "0.5rem" }}>🏦 الدفع عبر التحويل البنكي</p>
              <p style={{ fontSize: "0.88rem", color: "#475569", margin: "0.2rem 0" }}>البنك : <strong>{PAYMENT_INFO.rib.banque}</strong></p>
              <p style={{ fontSize: "0.88rem", color: "#475569", margin: "0.2rem 0" }}>رقم الحساب (RIB) : <strong>{PAYMENT_INFO.rib.numero}</strong></p>
              <p style={{ fontSize: "0.88rem", color: "#475569", margin: "0.2rem 0" }}>صاحب الحساب : <strong>{PAYMENT_INFO.rib.titulaire}</strong></p>
            </div>

            {/* UPLOAD PREUVE */}
            <div style={{
              marginBottom: "1rem",
              padding: "1rem",
              background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
              borderRadius: "12px",
              border: "2px dashed #38bdf8",
            }}>
              <p style={{ fontWeight: "700", color: "#0369a1", marginBottom: "0.75rem", fontSize: "0.95rem" }}>
                📤 إرفاق وصل الدفع (صورة أو PDF)
              </p>
              <label style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                width: "100%", padding: "0.75rem",
                background: preuveFile ? "#dcfce7" : "white",
                color: preuveFile ? "#166534" : "#475569",
                border: `1px solid ${preuveFile ? "#86efac" : "#cbd5e1"}`,
                borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem",
              }}>
                {preuveFile ? `✅ تم اختيار : ${preuveFile.name}` : "📎 اختر ملف وصل الدفع (صورة أو PDF)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  onChange={handlePreuveSelect}
                  style={{ display: "none" }}
                />
              </label>

              {preuvePreview && (
                <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
                  <img src={preuvePreview} alt="معاينة الوصل" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                </div>
              )}
              {preuveFile && !preuvePreview && (
                <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "#fef3c7", borderRadius: "8px", textAlign: "center", fontSize: "0.85rem", color: "#92400e" }}>
                  📄 تم اختيار ملف PDF
                </div>
              )}
            </div>

            {/* WhatsApp */}
            <div style={{ marginBottom: "1.25rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>— أو إرسال الوصل مباشرة عبر واتساب —</p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `السلام عليكم، أود إرسال وصل الدفع الخاص بـ ${libelle} (المبلغ: ${prixReel.toLocaleString("fr-FR")} د.ج).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dent-whatsapp"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem",
                  fontSize: "0.85rem",
                }}
              >
                💬 إرسال الوصل عبر واتساب
              </a>
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-dent-outline"
            style={{ flex: 1, padding: "0.65rem" }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSending}
            className="btn-dent-blue"
            style={{
              flex: 1, padding: "0.65rem",
              opacity: isSending ? 0.7 : 1,
            }}
          >
            {isSending ? "⏳ جارٍ الإرسال..." : "✅ تأكيد إرسال الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}
