import React, { useState } from "react";

export default function CataloguePaymentModal({ isOpen, onClose, course, typePaiement, onConfirm }) {
  const [preuveFile, setPreuveFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !course) return null;

  const isParcours = typePaiement === "PARCOURS_COMPLET";
  const price = isParcours ? (course.prixParcours || course.price) : (course.price || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(course.id, typePaiement, preuveFile);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem",
      direction: "rtl"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "2rem",
        maxWidth: "480px",
        width: "100%",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "700", color: "#1f2937" }}>
            💳 تأكيد طلب التسجيل
          </h2>
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af" }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: "1.25rem", padding: "1rem", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: "600", fontSize: "1rem", color: "#111827", marginBottom: "0.5rem" }}>
            {course.title}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>
            نوع الاشتراك: <strong>{isParcours ? "🎓 المسار الكامل" : "💳 هذا الدرس فقط"}</strong>
          </div>
          {price > 0 && (
            <div style={{ fontSize: "0.9rem", color: "#059669", fontWeight: "700", marginTop: "0.25rem" }}>
              السعر: {price} دج
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
              📄 إرفاق وصل الدفع (اختياري)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setPreuveFile(e.target.files[0] || null)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px dashed #cbd5e1",
                borderRadius: "8px",
                fontSize: "0.85rem"
              }}
            />
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
              يمكنك رفع صورة وصل الدفع (CCP / BaridiMob) لتسريع عملية تفعيل حسابك.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-dent-outline"
              style={{
                padding: "0.6rem 1.25rem",
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-dent-green"
              style={{
                padding: "0.6rem 1.25rem",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "جارٍ إرسال الطلب..." : "إرسال الطلب"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
