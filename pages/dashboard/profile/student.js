import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function StudentProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    dateNaissance: "",
    lieuNaissance: "",
    ecole: "",
    adresse: "",
    ville: "",
  });
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (user?.id) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/profile/student?userId=${user.id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setForm({
          dateNaissance: data.dateNaissance || "",
          lieuNaissance: data.lieuNaissance || "",
          ecole: data.ecole || "",
          adresse: data.adresse || "",
          ville: data.ville || "",
        });
        if (data.photo) setPhotoPreview(data.photo);
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Sauvegarder infos
      const res1 = await fetch(`/api/profile/student?userId=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res1.ok) {
        const data = await res1.json();
        setError(data.error || "خطأ في المعلومات");
        setLoading(false);
        return;
      }

      // Sauvegarder photo si changée
      const photoInput = document.getElementById("photoInput");
      if (photoInput?.files?.length > 0) {
        const formData = new FormData();
        formData.append("photo", photoInput.files[0]);

        const res2 = await fetch(`/api/users/upload-photo?userId=${user.id}`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!res2.ok) {
          const data = await res2.json();
          setError(data.error || "خطأ في الصورة");
          setLoading(false);
          return;
        }
      }

      setSuccess("✅ تم تحديث الملف الشخصي!");
      loadProfile();
    } catch (err) {
      setError("خطأ في الخادم");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "STUDENT") return null;

  return (
    <div dir="rtl" lang="ar" style={{ maxWidth: "500px", margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ color: "#3b82f6" }}>👨‍🎓 ملفي الشخصي</h1>

      {error && <div style={{ color: "#dc2626", background: "#fee2e2", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}
      {success && <div style={{ color: "#059669", background: "#d1fae5", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {/* Photo */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>📸 الصورة</label>
          <input id="photoInput" type="file" accept="image/*" onChange={handlePhotoChange} style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e0", borderRadius: "6px", boxSizing: "border-box" }} />
          {photoPreview && <img src={photoPreview} alt="معاينة" style={{ width: "80px", height: "80px", borderRadius: "50%", marginTop: "1rem", objectFit: "cover" }} />}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>📅 تاريخ الميلاد</label>
          <input type="date" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e0", borderRadius: "6px", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>📍 مكان الميلاد</label>
          <input type="text" name="lieuNaissance" value={form.lieuNaissance} onChange={handleChange} placeholder="المدينة" style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e0", borderRadius: "6px", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>🏫 المؤسسة</label>
          <input type="text" name="ecole" value={form.ecole} onChange={handleChange} placeholder="الاسم" style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e0", borderRadius: "6px", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>🏠 العنوان</label>
          <input type="text" name="adresse" value={form.adresse} onChange={handleChange} placeholder="الشارع" style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e0", borderRadius: "6px", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>🏙️ المدينة</label>
          <input type="text" name="ville" value={form.ville} onChange={handleChange} placeholder="المدينة" style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e0", borderRadius: "6px", boxSizing: "border-box" }} />
        </div>

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.75rem", background: loading ? "#cbd5e0" : "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "⏳ جارٍ الحفظ..." : "✅ حفظ"}
        </button>
      </form>
    </div>
  );
}
