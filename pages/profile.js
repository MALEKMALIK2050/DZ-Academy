import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  background: '#f8fafc',
  transition: 'border-color 0.2s',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: '600',
  color: '#374151',
  fontSize: '0.9rem',
};

const fieldWrap = { marginBottom: '1.4rem' };

function Field({ label, children }) {
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const photoRef = useRef(null);

  // ─── Badges state ─────────────────────────────────────────────────────────────
  const [badgesData, setBadgesData] = useState(null);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // ─── Formulaire profil ───────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    telephone: '',
    dateNaissance: '',
    lieuNaissance: '',
    village: '',
    adresse: '',
    codePostal: '',
    ville: '',
    pays: 'الجزائر',
    ecole: '',
    niveauScolaire: '',
    specialite: '',
    biographie: '',
    diplome: '',
    universite: '',
    niveau: '',
    annee: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        telephone:     user.telephone     || '',
        dateNaissance: user.dateNaissance ? user.dateNaissance.split('T')[0] : '',
        lieuNaissance: user.lieuNaissance || '',
        village:       user.village       || '',
        adresse:       user.adresse       || '',
        codePostal:    user.codePostal    || '',
        ville:         user.ville         || '',
        pays:          user.pays          || 'الجزائر',
        ecole:         user.ecole         || '',
        niveauScolaire:user.niveauScolaire|| '',
        specialite:    user.specialite    || '',
        biographie:    user.biographie    || '',
        diplome:       user.diplome       || '',
        universite:    user.universite    || '',
        niveau:        user.niveau        || '',
        annee:         user.annee         || '',
      });
    }
  }, [user]);

  // ─── Fetch badges when tab changes ────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'badges' && !badgesData && user) {
      setBadgesLoading(true);
      fetch('/api/student/badges', { credentials: 'include' })
        .then(r => r.json())
        .then(data => setBadgesData(data))
        .catch(() => {})
        .finally(() => setBadgesLoading(false));
    }
  }, [activeTab, badgesData, user]);

  // ─── Formulaire mot de passe ─────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  });

  // ─── UPLOAD PHOTO ─────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار صورة صالحة.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const fd = new FormData();
      fd.append('photo', file);

      const res = await fetch(`/api/users/upload-photo?userId=${user.id}`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });

      let data;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        setError(text || `خطأ في الخادم (${res.status})`);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'خطأ أثناء رفع الصورة');
        return;
      }

      setUser({ ...user, photo: data.photo });
      setSuccess('✅ تم تحديث صورة الملف الشخصي!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Erreur upload photo:', err);
      setError('خطأ في الخادم أثناء الرفع.');
    } finally {
      setLoading(false);
      if (photoRef.current) photoRef.current.value = '';
    }
  };

  // ─── METTRE À JOUR PROFIL ─────────────────────────────────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/users/profile?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطأ أثناء تحديث الملف الشخصي');
        return;
      }

      setUser({ ...user, ...data.user });
      setSuccess('✅ تم حفظ الملف الشخصي بنجاح!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Erreur update profil:', err);
      setError('خطأ في الخادم.');
    } finally {
      setLoading(false);
    }
  };

  // ─── CHANGER MOT DE PASSE ─────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      setError('كلمتا المرور الجديدتان غير متطابقتين.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/users/change-password?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطأ أثناء تغيير كلمة المرور');
        return;
      }

      setPasswordForm({ oldPassword: '', newPassword: '', newPasswordConfirm: '' });
      setSuccess('✅ تم تغيير كلمة المرور بنجاح!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Erreur change password:', err);
      setError('خطأ في الخادم.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const role = user?.role || '';

  const roleLabel = role === 'STUDENT' ? '🎓 طالب'
    : role === 'TEACHER' ? '📚 أستاذ'
    : role === 'DESIGNER' ? '🎨 مصمم'
    : role === 'ADMIN' ? '⚙️ مدير'
    : '';

  const completionPct = user?.pourcentageCompletion || 0;

  // ─── Tabs config ──────────────────────────────────────────────────────────────
  const profileTabs = [
    { key: 'info', label: '📋 المعلومات' },
    { key: 'badges', label: '🏆 الأوسمة' },
    { key: 'security', label: '🔒 الأمان' },
    { key: 'policy', label: '📜 سياسة التطبيق' },
  ];

  return (
    <ProtectedRoute>
      <div dir="rtl" lang="ar" style={{ minHeight: '100vh', background: "url('/images/bg-algerian.png') #f7f3ec", backgroundAttachment: 'fixed' }}>

        {/* ═══ Header compact ═══ */}
        <div style={{
          background: 'linear-gradient(135deg, #facc15, #f97316)',
          color: 'white',
          padding: '0.8rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
        }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', borderRadius: '8px', padding: '0.45rem 0.8rem', backdropFilter: 'blur(4px)' }}
          >
            → رجوع
          </button>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>👤 ملفي الشخصي</h1>
          {roleLabel && (
            <span style={{ marginRight: 'auto', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
              {roleLabel}
            </span>
          )}
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.2rem 0.8rem' }}>

          {/* Messages */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.8rem 1rem', borderRadius: '10px', marginBottom: '1rem', color: '#dc2626', fontWeight: '500', fontSize: '0.9rem' }}>
              ❌ {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '0.8rem 1rem', borderRadius: '10px', marginBottom: '1rem', color: '#16a34a', fontWeight: '500', fontSize: '0.9rem' }}>
              {success}
            </div>
          )}

          {/* ═══ Carte Photo + Infos (compact) ═══ */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.2rem',
            marginBottom: '1rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            {/* Photo avec overlay upload */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={user?.photo || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e0'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"}
                alt="صورة الملف الشخصي"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '3px solid #f97316',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <button
                onClick={() => photoRef.current?.click()}
                disabled={loading}
                title="رفع صورة"
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  left: '0px',
                  background: '#f97316',
                  border: '2px solid white',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                📷
              </button>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Infos */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: '0 0 0.15rem', fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>
                {user?.prenom} {user?.nom}
              </h2>
              <p style={{ margin: '0 0 0.4rem', color: '#64748b', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
              {/* Barre de complétion */}
              <div style={{ marginTop: '0.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '3px' }}>
                  <span>اكتمال الملف الشخصي</span>
                  <span style={{ fontWeight: '600' }}>{completionPct}%</span>
                </div>
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completionPct}%`, background: 'linear-gradient(90deg, #facc15, #f97316)', borderRadius: '10px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Onglets (scroll horizontal pour mobile) ═══ */}
          <div style={{
            display: 'flex',
            gap: '0.3rem',
            marginBottom: '1rem',
            background: 'white',
            borderRadius: '12px',
            padding: '0.3rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}>
            {profileTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setError(''); setSuccess(''); }}
                style={{
                  flex: '0 0 auto',
                  padding: '0.6rem 0.8rem',
                  background: activeTab === tab.key ? 'linear-gradient(135deg, #facc15, #f97316)' : 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: activeTab === tab.key ? 'white' : '#64748b',
                  fontWeight: activeTab === tab.key ? '700' : '500',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══ TAB: INFORMATIONS ═══ */}
          {activeTab === 'info' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

              <form onSubmit={handleUpdateProfile}>

                {/* ══ STUDENT ══ */}
                {role === 'STUDENT' && (
                  <>
                    <h3 style={{ margin: '0 0 1.5rem', color: '#b45309', borderBottom: '2px solid #fef3c7', paddingBottom: '0.5rem' }}>
                      🎓 معلومات الطالب
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="📅 تاريخ الميلاد">
                        <input type="date" value={formData.dateNaissance} onChange={set('dateNaissance')} style={inputStyle} />
                      </Field>
                      <Field label="📍 مكان الميلاد">
                        <input type="text" placeholder="الولاية / البلدية" value={formData.lieuNaissance} onChange={set('lieuNaissance')} style={inputStyle} />
                      </Field>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="🏘️ القرية / الحي">
                        <input type="text" placeholder="قريتك أو حيك" value={formData.village} onChange={set('village')} style={inputStyle} />
                      </Field>
                      <Field label="🏙️ المدينة">
                        <input type="text" placeholder="المسيلة، الجزائر العاصمة..." value={formData.ville} onChange={set('ville')} style={inputStyle} />
                      </Field>
                    </div>

                    <Field label="🏠 العنوان">
                      <input type="text" placeholder="الشارع، رقم البناية، الحي..." value={formData.adresse} onChange={set('adresse')} style={inputStyle} />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="الرمز البريدي">
                        <input type="text" placeholder="26000" value={formData.codePostal} onChange={set('codePostal')} style={inputStyle} />
                      </Field>
                      <Field label="🌍 البلد">
                        <input type="text" placeholder="الجزائر" value={formData.pays} onChange={set('pays')} style={inputStyle} />
                      </Field>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="📞 الهاتف">
                        <input type="tel" placeholder="+213 555 123 456" value={formData.telephone} onChange={set('telephone')} style={inputStyle} />
                      </Field>
                      <Field label="🏫 المؤسسة التعليمية">
                        <input type="text" placeholder="اسم المدرسة / الثانوية / الجامعة" value={formData.ecole} onChange={set('ecole')} style={inputStyle} />
                      </Field>
                    </div>

                    <Field label="📚 المستوى الدراسي">
                      <select value={formData.niveauScolaire} onChange={set('niveauScolaire')} style={inputStyle}>
                        <option value="">— اختر —</option>
                        <option value="PRIMAIRE">الابتدائي</option>
                        <option value="CEM">المتوسط (السنة الأولى - الرابعة متوسط)</option>
                        <option value="LYCEE">الثانوي (السنة الأولى - الثالثة ثانوي)</option>
                        <option value="BAC">البكالوريا</option>
                        <option value="LICENCE">الليسانس (سنة 1-3)</option>
                        <option value="MASTER">الماستر (سنة 1-2)</option>
                        <option value="DOCTORAT">الدكتوراه</option>
                      </select>
                    </Field>
                  </>
                )}

                {/* ══ TEACHER ══ */}
                {role === 'TEACHER' && (
                  <>
                    <h3 style={{ margin: '0 0 1.5rem', color: '#15803d', borderBottom: '2px solid #dcfce7', paddingBottom: '0.5rem' }}>
                      📚 معلومات الأستاذ
                    </h3>

                    <Field label="📖 المادة / التخصص المُدرَّس">
                      <input type="text" placeholder="الرياضيات، الفيزياء، الإعلام الآلي..." value={formData.specialite} onChange={set('specialite')} style={inputStyle} />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="🎓 مستوى التدريس">
                        <select value={formData.niveau} onChange={set('niveau')} style={inputStyle}>
                          <option value="">— اختر —</option>
                          <option value="Primaire">الابتدائي</option>
                          <option value="Collège">المتوسط / CEM</option>
                          <option value="Lycée">الثانوي</option>
                          <option value="Université">الجامعة</option>
                          <option value="Formation">التكوين المهني</option>
                          <option value="Tous niveaux">جميع المستويات</option>
                        </select>
                      </Field>
                      <Field label="📅 السنة الدراسية">
                        <input type="text" placeholder="2025/2026" value={formData.annee} onChange={set('annee')} style={inputStyle} />
                      </Field>
                    </div>

                    <Field label="🎓 الشهادة المتحصل عليها">
                      <input type="text" placeholder="ليسانس، ماستر، دكتوراه، مهندس دولة..." value={formData.diplome} onChange={set('diplome')} style={inputStyle} />
                    </Field>

                    <Field label="🏛️ الجامعة / المؤسسة">
                      <input type="text" placeholder="جامعة المسيلة، USTHB..." value={formData.universite} onChange={set('universite')} style={inputStyle} />
                    </Field>

                    <Field label="📞 الهاتف">
                      <input type="tel" placeholder="+213 555 123 456" value={formData.telephone} onChange={set('telephone')} style={inputStyle} />
                    </Field>

                    <Field label="✍️ نبذة / الوصف">
                      <textarea
                        placeholder="صف مسارك وخبراتك ومنهجيتك في التدريس..."
                        value={formData.biographie}
                        onChange={set('biographie')}
                        rows={5}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                      />
                    </Field>
                  </>
                )}

                {/* ══ DESIGNER ══ */}
                {role === 'DESIGNER' && (
                  <>
                    <h3 style={{ margin: '0 0 1.5rem', color: '#92400e', borderBottom: '2px solid #fef3c7', paddingBottom: '0.5rem' }}>
                      🎨 معلومات المصمم
                    </h3>

                    <Field label="🎨 مجال التخصص">
                      <input type="text" placeholder="التصميم البيداغوجي، التصميم الجرافيكي، التعلم الإلكتروني..." value={formData.specialite} onChange={set('specialite')} style={inputStyle} />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="📊 مستوى الخبرة">
                        <select value={formData.niveau} onChange={set('niveau')} style={inputStyle}>
                          <option value="">— اختر —</option>
                          <option value="Junior">مبتدئ</option>
                          <option value="Intermédiaire">متوسط</option>
                          <option value="Senior">متقدم</option>
                          <option value="Expert">خبير</option>
                        </select>
                      </Field>
                      <Field label="📅 سنوات الخبرة">
                        <input type="text" placeholder="مثال: 5 سنوات" value={formData.annee} onChange={set('annee')} style={inputStyle} />
                      </Field>
                    </div>

                    <Field label="🎓 الشهادة / الاعتماد">
                      <input type="text" placeholder="ماستر في الهندسة البيداغوجية، شهادة Adobe..." value={formData.diplome} onChange={set('diplome')} style={inputStyle} />
                    </Field>

                    <Field label="🏛️ الجامعة / المؤسسة">
                      <input type="text" placeholder="جامعة، مدرسة تكوين..." value={formData.universite} onChange={set('universite')} style={inputStyle} />
                    </Field>

                    <Field label="📞 الهاتف">
                      <input type="tel" placeholder="+213 555 123 456" value={formData.telephone} onChange={set('telephone')} style={inputStyle} />
                    </Field>

                    <Field label="✍️ نبذة / تقديم">
                      <textarea
                        placeholder="صف مسارك ومهاراتك وإنجازاتك..."
                        value={formData.biographie}
                        onChange={set('biographie')}
                        rows={5}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                      />
                    </Field>
                  </>
                )}

                {/* ══ ADMIN ══ */}
                {role === 'ADMIN' && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '1.1rem' }}>⚙️ حساب مدير — يمكنك إدارة المعلومات من لوحة التحكم.</p>
                  </div>
                )}

                {role !== 'ADMIN' && (
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: '0.5rem',
                      background: loading ? '#94a3b8' : 'linear-gradient(135deg, #facc15, #f97316)',
                      color: 'white',
                      padding: '0.85rem 2rem',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '700',
                      boxShadow: loading ? 'none' : '0 4px 15px rgba(249,115,22,0.35)',
                      transition: 'all 0.2s',
                      width: '100%',
                    }}
                  >
                    {loading ? '⏳ جارٍ الحفظ...' : '💾 حفظ المعلومات'}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* ═══ TAB: BADGES ═══ */}
          {activeTab === 'badges' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 1.2rem', color: '#b45309', borderBottom: '2px solid #fef3c7', paddingBottom: '0.5rem' }}>
                🏆 الأوسمة والإنجازات
              </h3>

              {badgesLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }}>🏆</div>
                  <p>جارٍ تحميل الأوسمة...</p>
                </div>
              ) : badgesData ? (
                <>
                  {/* XP & Level Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    borderRadius: '16px',
                    padding: '1.4rem',
                    color: 'white',
                    marginBottom: '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.2rem',
                    boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)',
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}>
                      {badgesData.levelStats?.level || 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.3rem' }}>
                        المستوى {badgesData.levelStats?.level || 1} — {badgesData.levelStats?.title || 'مبتدئ'}
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.4rem' }}>
                        {badgesData.xp || 0} XP  •  {badgesData.earnedBadgesCount || 0}/{badgesData.totalBadgesCount || 0} وسام
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${badgesData.levelStats?.progressPercent || 0}%`,
                          background: 'linear-gradient(90deg, #facc15, #f97316)',
                          borderRadius: '10px',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.2rem' }}>
                        {badgesData.levelStats?.currentXpInLevel || 0} / {badgesData.levelStats?.xpForNextLevel || 100} XP للمستوى التالي
                      </div>
                    </div>
                  </div>

                  {/* Badges Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '0.8rem',
                  }}>
                    {badgesData.badges?.map(badge => (
                      <div
                        key={badge.id}
                        style={{
                          background: badge.earned ? '#fffbeb' : '#f8fafc',
                          border: badge.earned ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '1rem 0.6rem',
                          textAlign: 'center',
                          opacity: badge.earned ? 1 : 0.5,
                          filter: badge.earned ? 'none' : 'grayscale(100%)',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                        }}
                      >
                        {badge.earned && (
                          <div style={{
                            position: 'absolute',
                            top: '-6px',
                            left: '-6px',
                            background: '#10b981',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            color: 'white',
                            boxShadow: '0 2px 6px rgba(16,185,129,0.4)',
                          }}>✓</div>
                        )}
                        <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
                          {badge.icon || '🏅'}
                        </div>
                        <div style={{
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          color: badge.earned ? '#92400e' : '#94a3b8',
                          marginBottom: '0.2rem',
                          lineHeight: '1.3',
                        }}>
                          {badge.title}
                        </div>
                        <div style={{
                          fontSize: '0.68rem',
                          color: badge.earned ? '#b45309' : '#cbd5e1',
                          lineHeight: '1.3',
                        }}>
                          {badge.description}
                        </div>
                        {badge.earned && badge.earnedAt && (
                          <div style={{ fontSize: '0.6rem', color: '#10b981', marginTop: '0.3rem', fontWeight: '600' }}>
                            ✅ {new Date(badge.earnedAt).toLocaleDateString('ar-DZ')}
                          </div>
                        )}
                        {!badge.earned && (
                          <div style={{ fontSize: '0.6rem', color: '#cbd5e1', marginTop: '0.3rem' }}>
                            🔒 غير مفتوح
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {badgesData.badges?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏅</div>
                      <p>لا توجد أوسمة بعد. استمر في التعلّم!</p>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <p>تعذر تحميل الأوسمة.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: SÉCURITÉ ═══ */}
          {activeTab === 'security' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 1.5rem', color: '#dc2626', borderBottom: '2px solid #fee2e2', paddingBottom: '0.5rem' }}>
                🔒 تغيير كلمة المرور
              </h3>

              <form onSubmit={handleChangePassword}>
                <Field label="كلمة المرور الحالية">
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    style={inputStyle}
                    placeholder="كلمة مرورك الحالية"
                  />
                </Field>

                <Field label="كلمة المرور الجديدة">
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    style={inputStyle}
                    placeholder="6 أحرف على الأقل"
                  />
                </Field>

                <Field label="تأكيد كلمة المرور الجديدة">
                  <input
                    type="password"
                    value={passwordForm.newPasswordConfirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPasswordConfirm: e.target.value })}
                    style={inputStyle}
                    placeholder="أعد كتابة كلمة المرور الجديدة"
                  />
                </Field>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.8rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#92400e' }}>
                  💡 <strong>نصيحة:</strong> استخدم كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز خاصة.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#94a3b8' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                    color: 'white',
                    padding: '0.85rem 2rem',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '700',
                    boxShadow: loading ? 'none' : '0 4px 15px rgba(220,38,38,0.35)',
                    width: '100%',
                  }}
                >
                  {loading ? '⏳ جارٍ التغيير...' : '🔐 تغيير كلمة المرور'}
                </button>
              </form>
            </div>
          )}

          {/* ═══ TAB: POLITIQUE APP MOBILE ═══ */}
          {activeTab === 'policy' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 1.2rem', color: '#059669', borderBottom: '2px solid #ecfdf5', paddingBottom: '0.5rem' }}>
                📜 شروط استخدام التطبيق المحمول
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '500', marginBottom: '1.2rem' }}>
                أكاديمية الشيخ بوعمامة — المرجع: CBA-MOB-005 · الإصدار 1.0
              </div>

              <div style={{ color: '#374151', lineHeight: '1.8', fontSize: '0.9rem' }}>
                <PolicySection title="1. الموضوع">
                  تنظم هذه الشروط الوصول إلى تطبيق أكاديمية الشيخ بوعمامة LMS المحمول واستخدامه، الذي يتيح للمستخدمين المعتمدين الوصول إلى الخدمات التعليمية من جهاز محمول.
                </PolicySection>

                <PolicySection title="2. نطاق التطبيق">
                  تسري هذه الشروط على تطبيق أندرويد وأي إصدار iOS مستقبلي وجميع التحديثات الرسمية.
                </PolicySection>

                <PolicySection title="3. شروط الوصول">
                  يتطلب استخدام التطبيق حسابًا صالحًا واتصالًا بالإنترنت وجهازًا متوافقًا. قد تتطلب بعض الميزات إصدارًا أدنى من نظام التشغيل.
                </PolicySection>

                <PolicySection title="4. حسابات المستخدمين">
                  التطبيق مخصص للطلاب والأساتذة والمصممين التعليميين والمديرين. كل مستخدم مسؤول عن سرية بياناته. مشاركة الحساب بين عدة أشخاص ممنوعة.
                </PolicySection>

                <PolicySection title="5. الميزات">
                  حسب الصلاحيات الممنوحة، يتيح التطبيق: الاطلاع على الدروس، تحميل الموارد، مشاهدة الفيديوهات، الإجابة على الاختبارات، تسليم الواجبات، الاطلاع على النتائج وتلقي الإشعارات.
                </PolicySection>

                <PolicySection title="6. الاستخدام المسموح">
                  <p style={{ margin: '0 0 0.5rem' }}>يلتزم المستخدم باستخدام التطبيق وفقًا لغرضه التعليمي. يُمنع:</p>
                  <ul style={{ listStyleType: 'disc', paddingRight: '1.5rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <li>محاولة الوصول إلى بيانات مستخدمين آخرين</li>
                    <li>تعديل أو تجاوز آليات الأمان</li>
                    <li>استخدام التطبيق لأغراض غير مشروعة</li>
                    <li>نشر محتويات مخالفة للقوانين</li>
                    <li>تعطيل عمل الخدمات</li>
                  </ul>
                </PolicySection>

                <PolicySection title="7. البيانات الشخصية">
                  يعالج التطبيق بعض البيانات الضرورية لعمله وفقًا لسياسة الخصوصية، بما في ذلك: معلومات التعريف، التقدم التعليمي، نتائج التقييمات، سجلات الاتصال وإعدادات الحساب.
                </PolicySection>

                <PolicySection title="8. أذونات التطبيق">
                  <p style={{ margin: '0 0 0.5rem' }}>لا يطلب التطبيق سوى الأذونات الضرورية لعمله:</p>
                  <ul style={{ listStyleType: 'disc', paddingRight: '1.5rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <li>التخزين: لتحميل أو الاطلاع على المستندات التعليمية</li>
                    <li>الإشعارات: للإبلاغ بالمحتويات والرسائل والنتائج الجديدة</li>
                    <li>الكاميرا: فقط عند استخدام ميزة المسح الضوئي أو التحميل بالصورة</li>
                    <li>الميكروفون: فقط عند تشغيل ميزة التسجيل الصوتي</li>
                  </ul>
                  <p style={{ margin: '0.5rem 0 0' }}>يمكن إلغاء كل إذن من إعدادات جهازك.</p>
                </PolicySection>

                <PolicySection title="9. التحديثات">
                  قد تنشر أكاديمية الشيخ بوعمامة تحديثات لتحسين الأمان وإصلاح الأخطاء وإضافة ميزات جديدة. يُوصى بتثبيت التحديثات فور توفرها.
                </PolicySection>

                <PolicySection title="10. التوفر">
                  التطبيق مقدم "كما هو". قد تحدث انقطاعات أثناء عمليات الصيانة أو بسبب حوادث تقنية أو قوة قاهرة.
                </PolicySection>

                <PolicySection title="11. الملكية الفكرية">
                  التطبيق وكوده وواجهته ونصوصه وصوره وفيديوهاته ودروسه وجميع محتوياته محمية بأحكام الملكية الفكرية. يُحظر أي نسخ أو تعديل أو توزيع غير مصرح به.
                </PolicySection>

                <PolicySection title="12. تعليق أو حذف الحساب">
                  يمكن لأكاديمية الشيخ بوعمامة تعليق أو حذف حساب في حالة مخالفة هذه الشروط أو الاحتيال أو الاستخدام المسيء.
                </PolicySection>

                <PolicySection title="13. حدود المسؤولية">
                  لا تتحمل أكاديمية الشيخ بوعمامة مسؤولية الأضرار الناتجة عن سوء استخدام التطبيق أو عدم التوافق مع بعض الأجهزة أو انقطاع مؤقت للخدمات.
                </PolicySection>

                <PolicySection title="14. إلغاء التثبيت وحذف الحساب">
                  يمكنك إلغاء تثبيت التطبيق في أي وقت. هذا لا يؤدي إلى حذف حسابك أو بياناتك. للحذف النهائي، تواصل معنا عبر البريد أدناه.
                </PolicySection>

                <PolicySection title="15. التعديلات">
                  يمكن تعديل هذه الشروط لمواكبة التطورات التقنية والتنظيمية. النسخة المعمول بها هي المنشورة على الموقع الرسمي أو المتاحة من التطبيق.
                </PolicySection>

                <PolicySection title="16. القانون المطبق">
                  تخضع هذه الشروط للقانون المعمول به في الجزائر.
                </PolicySection>

                <PolicySection title="17. التواصل">
                  <p style={{ margin: 0 }}>لأي سؤال حول التطبيق المحمول، تواصل معنا على: <strong>contact@bouamama-academy.dz</strong></p>
                </PolicySection>
              </div>
            </div>
          )}

        </div>

        {/* ═══ Scrollbar hide + pulse animation ═══ */}
        <style>{`
          div::-webkit-scrollbar { display: none; }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}

// ─── Composant pour les sections de la politique ────────────────────────────────
function PolicySection({ title, children }) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <h4 style={{ fontWeight: '700', fontSize: '0.95rem', marginTop: '0', marginBottom: '0.4rem', color: '#1f2937' }}>
        {title}
      </h4>
      <div style={{ color: '#4b5563' }}>
        {typeof children === 'string' ? <p style={{ margin: 0 }}>{children}</p> : children}
      </div>
    </div>
  );
}
