import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function DesignerProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    matieres: [],
    niveaux: [],
    telephone: "",
    bio: "",
    photo: "",
  });

  const [matiereInput, setMatiereInput] = useState("");
  const [niveauInput, setNiveauInput] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/profile/designer?userId=${user.id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setForm({
          matieres: Array.isArray(data.matieres) ? data.matieres : [],
          niveaux: Array.isArray(data.niveaux) ? data.niveaux : [],
          telephone: data.telephone || "",
          bio: data.bio || "",
          photo: data.photo || "",
        });
      }
    } catch (err) {
      console.error("Erreur chargement profil:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const addMatiere = () => {
    if (matiereInput.trim() && !form.matieres.includes(matiereInput)) {
      setForm(prev => ({ ...prev, matieres: [...prev.matieres, matiereInput] }));
      setMatiereInput("");
    }
  };

  const removeMatiere = (matiere) => {
    setForm(prev => ({ ...prev, matieres: prev.matieres.filter(m => m !== matiere) }));
  };

  const addNiveau = () => {
    if (niveauInput.trim() && !form.niveaux.includes(niveauInput)) {
      setForm(prev => ({ ...prev, niveaux: [...prev.niveaux, niveauInput] }));
      setNiveauInput("");
    }
  };

  const removeNiveau = (niveau) => {
    setForm(prev => ({ ...prev, niveaux: prev.niveaux.filter(n => n !== niveau) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Vérifier que matieres et niveaux sont des arrays
      const submitData = {
        matieres: Array.isArray(form.matieres) ? form.matieres : [],
        niveaux: Array.isArray(form.niveaux) ? form.niveaux : [],
        telephone: form.telephone || undefined,
        bio: form.bio || undefined,
        photo: form.photo || undefined,
      };

      const res = await fetch(`/api/profile/designer?userId=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("✅ تم تحديث الملف الشخصي بنجاح!");
      } else {
        setError(data.error || "خطأ في التحديث");
      }
    } catch (err) {
      setError("خطأ في الخادم: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "DESIGNER") return null;

  return (
    <div dir="rtl" lang="ar" style={{ maxWidth: "600px", margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ color: "#8b5cf6" }}>🎨 ملفي الشخصي كمصمم</h1>

      {error && (
        <div style={{
          background: "#fee2e2",
          color: "#dc2626",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: "#d1fae5",
          color: "#059669",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        background: "white",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        {/* Photo */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>
            📸 صورة الملف الشخصي
          </label>
          {form.photo && (
            <div style={{ marginBottom: "1rem" }}>
              <img
                src={form.photo}
                alt="الملف الشخصي"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #8b5cf6",
                }}
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #cbd5e0",
              borderRadius: "6px",
            }}
          />
        </div>

        {/* Matières */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>
            📚 أنواع الدورات المُنشأة
          </label>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              type="text"
              value={matiereInput}
              onChange={(e) => setMatiereInput(e.target.value)}
              placeholder="مثال: بايثون، تصميم الويب"
              style={{
                flex: 1,
                padding: "0.75rem",
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
              }}
            />
            <button
              type="button"
              onClick={addMatiere}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ➕ إضافة
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {Array.isArray(form.matieres) && form.matieres.map((matiere) => (
              <div
                key={matiere}
                style={{
                  background: "#ede9fe",
                  color: "#8b5cf6",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {matiere}
                <button
                  type="button"
                  onClick={() => removeMatiere(matiere)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Niveaux */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>
            📊 المستويات المستهدفة
          </label>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              type="text"
              value={niveauInput}
              onChange={(e) => setNiveauInput(e.target.value)}
              placeholder="مثال: مبتدئ، متوسط"
              style={{
                flex: 1,
                padding: "0.75rem",
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
              }}
            />
            <button
              type="button"
              onClick={addNiveau}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ➕ إضافة
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {Array.isArray(form.niveaux) && form.niveaux.map((niveau) => (
              <div
                key={niveau}
                style={{
                  background: "#ede9fe",
                  color: "#8b5cf6",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {niveau}
                <button
                  type="button"
                  onClick={() => removeNiveau(niveau)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Téléphone */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>
            📱 الهاتف
          </label>
          <input
            type="tel"
            name="telephone"
            value={form.telephone}
            onChange={handleChange}
            placeholder="+213 7XX XXX XXX"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #cbd5e0",
              borderRadius: "6px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>
            ✍️ نبذة / تقديم
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="صف خبرتك وإبداعاتك..."
            rows="4"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #cbd5e0",
              borderRadius: "6px",
              fontSize: "1rem",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: loading ? "#cbd5e0" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⏳ جارٍ الحفظ..." : "✅ حفظ ملفي الشخصي"}
        </button>
      </form>
    </div>
  );
}
