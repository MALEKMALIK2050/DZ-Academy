import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function CompleteDataPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  const [formData, setFormData] = useState({
    adresse: "",
    codePostal: "",
    ville: "",
    pays: "الجزائر",
    telephone: "",
    dateNaissance: "",
    lieuNaissance: "",
    ecole: "",
    niveauScolaire: "",
    photo: "",
  });

  // Charger l'utilisateur
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Essayer de récupérer la session
        const sessionRes = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!sessionRes.ok) {
          router.push("/login");
          return;
        }

        const session = await sessionRes.json();

        if (!session?.user?.id) {
          router.push("/login");
          return;
        }

        setUser(session.user);

        // Charger les données du profil
        const profileRes = await fetch("/api/profile/me", {
          credentials: "include",
          headers: {
            "X-User-ID": session.user.id.toString(),
          },
        });

        if (profileRes.ok) {
          const data = profileRes.json();
          const userData = data.user || {};

          setFormData({
            adresse: userData.adresse || "",
            codePostal: userData.codePostal || "",
            ville: userData.ville || "",
            pays: userData.pays || "الجزائر",
            telephone: userData.telephone || "",
            dateNaissance: userData.dateNaissance || "",
            lieuNaissance: userData.lieuNaissance || "",
            ecole: userData.ecole || "",
            niveauScolaire: userData.niveauScolaire || "",
            photo: "",
          });

          if (userData.photo) {
            setPhotoPreview(userData.photo);
          }
        }
      } catch (err) {
        console.error("Erreur chargement:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          photo: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (!user?.id) {
        setError("المستخدم غير معرَّف");
        return;
      }

      // Préparer les données
      const submitData = { ...formData };
      if (!submitData.photo) {
        delete submitData.photo; // Ne pas envoyer une photo vide
      }

      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id.toString(),
        },
        credentials: "include",
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطأ أثناء التحديث");
        return;
      }

      setMessage(`✅ تم تحديث الملف الشخصي! اكتمل بنسبة ${data.pourcentageCompletion}%`);
      
      setTimeout(() => {
        router.push("/dashboard/student");
      }, 2000);
    } catch (err) {
      console.error("Erreur soumission:", err);
      setError("خطأ في الشبكة: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" lang="ar" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc"
      }}>
        <div style={{
          textAlign: "center",
          padding: "2rem"
        }}>
          <div style={{
            fontSize: "3rem",
            marginBottom: "1rem"
          }}>⏳</div>
          <p style={{
            fontSize: "1.2rem",
            color: "#718096",
            fontWeight: "500"
          }}>
            جارٍ التحميل...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div dir="rtl" lang="ar" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc"
      }}>
        <div style={{
          textAlign: "center",
          padding: "2rem",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <p style={{
            fontSize: "1.1rem",
            color: "#ef4444",
            marginBottom: "1rem"
          }}>
            ❌ يجب عليك تسجيل الدخول
          </p>
          <button
            onClick={() => router.push("/login")}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            الذهاب إلى تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" style={{ minHeight: "100vh", background: "url('/images/bg-algerian.png') #f7f3ec", backgroundAttachment: "fixed", padding: "2rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "0.5rem", color: "#1e293b" }}>
          📝 أكمل بياناتك
        </h1>
        <p style={{ color: "#718096", marginBottom: "2rem" }}>
          املأ معلوماتك لإكمال ملفك الشخصي
        </p>

        {message && (
          <div style={{
            backgroundColor: "#d1fae5",
            color: "#065f46",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            border: "1px solid #6ee7b7"
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            border: "1px solid #fca5a5"
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          {/* Photo */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
              📸 صورة الملف الشخصي
            </label>
            <div style={{
              width: "100px",
              height: "100px",
              backgroundColor: "#f1f5f9",
              borderRadius: "8px",
              marginBottom: "1rem",
              backgroundImage: photoPreview ? `url(${photoPreview})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "2px solid #e2e8f0"
            }} />
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{
                display: "block",
                padding: "0.5rem",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                width: "100%"
              }}
            />
          </div>

          {/* Adresse */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
              📍 العنوان
            </label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleInputChange}
              placeholder="مثال: 123 شارع السلام"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Code Postal, Ville, Pays */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
                الرمز البريدي
              </label>
              <input
                type="text"
                name="codePostal"
                value={formData.codePostal}
                onChange={handleInputChange}
                placeholder="16000"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
                المدينة
              </label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleInputChange}
                placeholder="الجزائر العاصمة"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
              البلد
            </label>
            <input
              type="text"
              name="pays"
              value={formData.pays}
              onChange={handleInputChange}
              placeholder="الجزائر"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Téléphone */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
              📱 الهاتف
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleInputChange}
              placeholder="213 5XX XXX XXX"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Naissance */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
                تاريخ الميلاد
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
                مكان الميلاد
              </label>
              <input
                type="text"
                name="lieuNaissance"
                value={formData.lieuNaissance}
                onChange={handleInputChange}
                placeholder="الجزائر العاصمة"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Scolarité */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
                المدرسة/الجامعة
              </label>
              <input
                type="text"
                name="ecole"
                value={formData.ecole}
                onChange={handleInputChange}
                placeholder="اسم المؤسسة"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#1e293b" }}>
                المستوى الدراسي
              </label>
              <select
                name="niveauScolaire"
                value={formData.niveauScolaire}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              >
                <option value="">اختر...</option>
                <option value="PRIMAIRE">الابتدائي</option>
                <option value="CEM">المتوسط</option>
                <option value="LYCEE">الثانوي</option>
                <option value="BAC">البكالوريا</option>
                <option value="LICENCE">الليسانس</option>
                <option value="MASTER">الماستر</option>
                <option value="DOCTORAT">الدكتوراه</option>
              </select>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                flex: 1,
                padding: "0.75rem",
                backgroundColor: "#f1f5f9",
                color: "#1e293b",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: "0.75rem",
                backgroundColor: submitting ? "#cbd5e1" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer"
              }}
            >
              {submitting ? "جارٍ الحفظ..." : "✅ حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
