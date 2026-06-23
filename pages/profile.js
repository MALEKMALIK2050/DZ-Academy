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

  // ─── Formulaire profil ───────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    telephone: '',
    // STUDENT
    dateNaissance: '',
    lieuNaissance: '',
    village: '',
    adresse: '',
    codePostal: '',
    ville: '',
    pays: 'Algérie',
    ecole: '',
    niveauScolaire: '',
    // TEACHER / DESIGNER
    specialite: '',
    biographie: '',
    diplome: '',
    universite: '',
    niveau: '',
    annee: '',
  });

  // Pré-remplir depuis user dès que disponible
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
        pays:          user.pays          || 'Algérie',
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
      setError('Veuillez sélectionner une image valide.');
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
        setError(text || `Erreur serveur (${res.status})`);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'upload de la photo');
        return;
      }

      setUser({ ...user, photo: data.photo });
      setSuccess('✅ Photo de profil mise à jour !');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Erreur upload photo:', err);
      setError('Erreur serveur lors de l\'upload.');
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
        setError(data.error || 'Erreur lors de la mise à jour du profil');
        return;
      }

      setUser({ ...user, ...data.user });
      setSuccess('✅ Profil enregistré avec succès !');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Erreur update profil:', err);
      setError('Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ─── CHANGER MOT DE PASSE ─────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
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
        setError(data.error || 'Erreur lors du changement de mot de passe');
        return;
      }

      setPasswordForm({ oldPassword: '', newPassword: '', newPasswordConfirm: '' });
      setSuccess('✅ Mot de passe changé avec succès !');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Erreur change password:', err);
      setError('Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const role = user?.role || '';

  const roleLabel = role === 'STUDENT' ? '🎓 Étudiant'
    : role === 'TEACHER' ? '📚 Enseignant'
    : role === 'DESIGNER' ? '🎨 Concepteur'
    : role === 'ADMIN' ? '⚙️ Administrateur'
    : '';

  const completionPct = user?.pourcentageCompletion || 0;

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%)' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          color: 'white',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(30,64,175,0.3)',
        }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', borderRadius: '8px', padding: '0.5rem 1rem', backdropFilter: 'blur(4px)' }}
          >
            ← Retour
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>👤 Mon Profil</h1>
          {roleLabel && (
            <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
              {roleLabel}
            </span>
          )}
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Messages */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem 1.2rem', borderRadius: '10px', marginBottom: '1.2rem', color: '#dc2626', fontWeight: '500' }}>
              ❌ {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '1rem 1.2rem', borderRadius: '10px', marginBottom: '1.2rem', color: '#16a34a', fontWeight: '500' }}>
              {success}
            </div>
          )}

          {/* Carte Photo + Infos */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 20px rgba(0,0,0,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
          }}>
            {/* Photo */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={user?.photo || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e0'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"}
                  alt="Photo de profil"
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: '4px solid #3b82f6',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <button
                  onClick={() => photoRef.current?.click()}
                  disabled={loading}
                  title="Upload photo"
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    background: '#3b82f6',
                    border: '2px solid white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  📷
                </button>
              </div>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => photoRef.current?.click()}
                disabled={loading}
                style={{
                  marginTop: '0.8rem',
                  background: 'none',
                  border: '1.5px solid #3b82f6',
                  color: '#3b82f6',
                  borderRadius: '8px',
                  padding: '0.4rem 0.9rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '⏳ Upload...' : '📷 Upload photo'}
              </button>
            </div>

            {/* Infos */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.4rem', color: '#1e293b' }}>
                {user?.prenom} {user?.nom}
              </h2>
              <p style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.95rem' }}>{user?.email}</p>
              <span style={{
                background: role === 'STUDENT' ? '#dbeafe' : role === 'TEACHER' ? '#dcfce7' : '#fef3c7',
                color: role === 'STUDENT' ? '#1d4ed8' : role === 'TEACHER' ? '#15803d' : '#92400e',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '700',
              }}>
                {roleLabel}
              </span>
              {/* Barre de complétion */}
              {completionPct > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                    <span>Profil complété</span>
                    <span style={{ fontWeight: '600' }}>{completionPct}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${completionPct}%`, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', borderRadius: '10px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Onglets */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', background: 'white', borderRadius: '12px', padding: '0.4rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            {[
              { key: 'info', label: '📋 Informations' },
              { key: 'security', label: '🔒 Sécurité' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setError(''); setSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: activeTab === tab.key ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: activeTab === tab.key ? 'white' : '#64748b',
                  fontWeight: activeTab === tab.key ? '700' : '500',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── TAB: INFORMATIONS ─── */}
          {activeTab === 'info' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>

              <form onSubmit={handleUpdateProfile}>

                {/* ══ STUDENT ══ */}
                {role === 'STUDENT' && (
                  <>
                    <h3 style={{ margin: '0 0 1.5rem', color: '#1e40af', borderBottom: '2px solid #dbeafe', paddingBottom: '0.5rem' }}>
                      🎓 Informations de l'étudiant
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="📅 Date de naissance">
                        <input type="date" value={formData.dateNaissance} onChange={set('dateNaissance')} style={inputStyle} />
                      </Field>
                      <Field label="📍 Lieu de naissance">
                        <input type="text" placeholder="Wilaya / Commune" value={formData.lieuNaissance} onChange={set('lieuNaissance')} style={inputStyle} />
                      </Field>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="🏘️ Village / Quartier">
                        <input type="text" placeholder="Votre village ou quartier" value={formData.village} onChange={set('village')} style={inputStyle} />
                      </Field>
                      <Field label="🏙️ Ville">
                        <input type="text" placeholder="M'Sila, Alger..." value={formData.ville} onChange={set('ville')} style={inputStyle} />
                      </Field>
                    </div>

                    <Field label="🏠 Adresse">
                      <input type="text" placeholder="Rue, N° bâtiment, cité..." value={formData.adresse} onChange={set('adresse')} style={inputStyle} />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="Code postal">
                        <input type="text" placeholder="26000" value={formData.codePostal} onChange={set('codePostal')} style={inputStyle} />
                      </Field>
                      <Field label="🌍 Pays">
                        <input type="text" placeholder="Algérie" value={formData.pays} onChange={set('pays')} style={inputStyle} />
                      </Field>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="📞 Téléphone">
                        <input type="tel" placeholder="+213 555 123 456" value={formData.telephone} onChange={set('telephone')} style={inputStyle} />
                      </Field>
                      <Field label="🏫 Établissement scolaire">
                        <input type="text" placeholder="Nom de l'école / lycée / université" value={formData.ecole} onChange={set('ecole')} style={inputStyle} />
                      </Field>
                    </div>

                    <Field label="📚 Niveau scolaire">
                      <select value={formData.niveauScolaire} onChange={set('niveauScolaire')} style={inputStyle}>
                        <option value="">— Sélectionner —</option>
                        <option value="PRIMAIRE">Primaire</option>
                        <option value="CEM">Collège / CEM (6ème–3ème)</option>
                        <option value="LYCEE">Lycée (2nde–Terminale)</option>
                        <option value="BAC">Baccalauréat</option>
                        <option value="LICENCE">Licence (L1–L3)</option>
                        <option value="MASTER">Master (M1–M2)</option>
                        <option value="DOCTORAT">Doctorat</option>
                      </select>
                    </Field>
                  </>
                )}

                {/* ══ TEACHER ══ */}
                {role === 'TEACHER' && (
                  <>
                    <h3 style={{ margin: '0 0 1.5rem', color: '#15803d', borderBottom: '2px solid #dcfce7', paddingBottom: '0.5rem' }}>
                      📚 Informations de l'enseignant
                    </h3>

                    <Field label="📖 Matière / Spécialité enseignée">
                      <input type="text" placeholder="Mathématiques, Physique, Informatique..." value={formData.specialite} onChange={set('specialite')} style={inputStyle} />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="🎓 Niveau d'enseignement">
                        <select value={formData.niveau} onChange={set('niveau')} style={inputStyle}>
                          <option value="">— Sélectionner —</option>
                          <option value="Primaire">Primaire</option>
                          <option value="Collège">Collège / CEM</option>
                          <option value="Lycée">Lycée</option>
                          <option value="Université">Université</option>
                          <option value="Formation">Formation professionnelle</option>
                          <option value="Tous niveaux">Tous niveaux</option>
                        </select>
                      </Field>
                      <Field label="📅 Année scolaire">
                        <input type="text" placeholder="2025/2026" value={formData.annee} onChange={set('annee')} style={inputStyle} />
                      </Field>
                    </div>

                    <Field label="🎓 Diplôme obtenu">
                      <input type="text" placeholder="Licence, Master, Doctorat, Ingéniorat..." value={formData.diplome} onChange={set('diplome')} style={inputStyle} />
                    </Field>

                    <Field label="🏛️ Université / Institution">
                      <input type="text" placeholder="Université de M'Sila, USTHB..." value={formData.universite} onChange={set('universite')} style={inputStyle} />
                    </Field>

                    <Field label="📞 Téléphone">
                      <input type="tel" placeholder="+213 555 123 456" value={formData.telephone} onChange={set('telephone')} style={inputStyle} />
                    </Field>

                    <Field label="✍️ Biographie / Description">
                      <textarea
                        placeholder="Décrivez votre parcours, expériences et méthode d'enseignement..."
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
                      🎨 Informations du concepteur
                    </h3>

                    <Field label="🎨 Domaine de spécialité">
                      <input type="text" placeholder="Conception pédagogique, Design graphique, E-learning..." value={formData.specialite} onChange={set('specialite')} style={inputStyle} />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="📊 Niveau d'expertise">
                        <select value={formData.niveau} onChange={set('niveau')} style={inputStyle}>
                          <option value="">— Sélectionner —</option>
                          <option value="Junior">Junior</option>
                          <option value="Intermédiaire">Intermédiaire</option>
                          <option value="Senior">Senior</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </Field>
                      <Field label="📅 Années d'expérience">
                        <input type="text" placeholder="ex: 5 ans" value={formData.annee} onChange={set('annee')} style={inputStyle} />
                      </Field>
                    </div>

                    <Field label="🎓 Diplôme / Certification">
                      <input type="text" placeholder="Master en ingénierie pédagogique, Certification Adobe..." value={formData.diplome} onChange={set('diplome')} style={inputStyle} />
                    </Field>

                    <Field label="🏛️ Université / Institution">
                      <input type="text" placeholder="Université, École de formation..." value={formData.universite} onChange={set('universite')} style={inputStyle} />
                    </Field>

                    <Field label="📞 Téléphone">
                      <input type="tel" placeholder="+213 555 123 456" value={formData.telephone} onChange={set('telephone')} style={inputStyle} />
                    </Field>

                    <Field label="✍️ Biographie / Présentation">
                      <textarea
                        placeholder="Décrivez votre parcours, vos compétences et vos réalisations..."
                        value={formData.biographie}
                        onChange={set('biographie')}
                        rows={5}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                      />
                    </Field>
                  </>
                )}

                {/* ══ ADMIN (lecture seule pour les infos) ══ */}
                {role === 'ADMIN' && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '1.1rem' }}>⚙️ Compte administrateur — gérez les informations depuis le panneau d'administration.</p>
                  </div>
                )}

                {role !== 'ADMIN' && (
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: '0.5rem',
                      background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1e40af, #3b82f6)',
                      color: 'white',
                      padding: '0.85rem 2rem',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '700',
                      boxShadow: loading ? 'none' : '0 4px 15px rgba(59,130,246,0.4)',
                      transition: 'all 0.2s',
                      width: '100%',
                    }}
                  >
                    {loading ? '⏳ Enregistrement...' : '💾 Enregistrer les informations'}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* ─── TAB: SÉCURITÉ ─── */}
          {activeTab === 'security' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
              <h3 style={{ margin: '0 0 1.5rem', color: '#dc2626', borderBottom: '2px solid #fee2e2', paddingBottom: '0.5rem' }}>
                🔒 Changer le mot de passe
              </h3>

              <form onSubmit={handleChangePassword}>
                <Field label="Mot de passe actuel">
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    style={inputStyle}
                    placeholder="Votre mot de passe actuel"
                  />
                </Field>

                <Field label="Nouveau mot de passe">
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    style={inputStyle}
                    placeholder="Minimum 6 caractères"
                  />
                </Field>

                <Field label="Confirmer le nouveau mot de passe">
                  <input
                    type="password"
                    value={passwordForm.newPasswordConfirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPasswordConfirm: e.target.value })}
                    style={inputStyle}
                    placeholder="Répétez le nouveau mot de passe"
                  />
                </Field>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.88rem', color: '#92400e' }}>
                  💡 <strong>Conseil :</strong> Utilisez un mot de passe fort avec majuscules, minuscules, chiffres et caractères spéciaux.
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
                  {loading ? '⏳ Changement...' : '🔐 Changer le mot de passe'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
