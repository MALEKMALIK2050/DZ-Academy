import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SetupWizardPage() {
  const router = useRouter();
  const { id: courseId } = router.query;
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!router.isReady) return <div style={{ padding: '2rem' }}>⏳</div>;

  const steps = [
    { num: 1, name: 'Infos', icon: '📋' },
    { num: 2, name: 'Pretest', icon: '📝' },
    { num: 3, name: 'Chapitres', icon: '📖' },
    { num: 4, name: 'Quizzes', icon: '📊' },
    { num: 5, name: 'Aperçu', icon: '✅' },
  ];

  const handleFileSelect = (e) => {
    setFile(e.target.files?.[0]);
    setError('');
  };

const handleImport = async (importType) => {
  if (!file) {
    setError('Sélectionnez un fichier');
    return;
  }

  setLoading(true);
  setError('');
  setSuccess('');

  try {
    console.log('1️⃣ FileReader...');
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(',')[1];
        console.log('2️⃣ Base64:', base64.substring(0, 50) + '...');
        
        const url = `/api/import/${importType}?courseId=${courseId}`;
        console.log('3️⃣ URL:', url);
        
        const payload = { fileBase64: base64 };
        if (importType === 'quizzes') payload.type = 'FORMATIF';
        
        console.log('4️⃣ POST...');
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        console.log('5️⃣ Status:', res.status);
        const data = await res.json();
        console.log('6️⃣ Data:', data);

        if (!res.ok) {
          setError(`❌ ${data.error || 'Erreur API'}`);
          setLoading(false);
          return;
        }

        setSuccess(`✅ ${data.created} créé(s)`);
        setFile(null);
        setLoading(false);
        
        setTimeout(() => setStep(step + 1), 1500);

      } catch (err) {
        console.error('❌ Inner error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    reader.onerror = (err) => {
      console.error('❌ FileReader error:', err);
      setError('Erreur lecture fichier');
      setLoading(false);
    };

    reader.readAsDataURL(file);

  } catch (err) {
    console.error('❌ Outer error:', err);
    setError(err.message);
    setLoading(false);
  }
};

  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/import/publish?courseId=${courseId}`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error);
      } else {
        alert('🎉 Cours publié!');
        router.push(`/dashboard/designer/courses/${courseId}`);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['DESIGNER']}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <h1>🚀 Configuration du cours</h1>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', marginBottom: '1rem' }}>
            {steps.map(s => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: step >= s.num ? '#3182ce' : '#e2e8f0',
                  color: step >= s.num ? 'white' : '#718096',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          minHeight: '400px',
        }}>
          {step === 1 && (
            <div>
              <h2>📋 Infos cours</h2>
              <p style={{ color: '#718096' }}>Cours ID: {courseId}</p>
              <button
                onClick={() => setStep(2)}
                style={{
                  background: '#3182ce',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Continuer →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2>📝 Pretest</h2>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="pretestFile"
              />
              <label htmlFor="pretestFile" style={{ cursor: 'pointer', display: 'block', marginBottom: '1rem' }}>
                <div style={{
                  padding: '2rem',
                  background: '#ebf8ff',
                  border: '2px dashed #3182ce',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                  <div>{file ? file.name : 'Sélectionnez pretest.xlsx'}</div>
                </div>
              </label>
              {error && <div style={{ color: '#e53e3e', marginBottom: '1rem' }}>❌ {error}</div>}
              {success && <div style={{ color: '#059669', marginBottom: '1rem' }}>{success}</div>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleImport('pretest')}
                  disabled={!file || loading}
                  style={{
                    flex: 1,
                    background: file && !loading ? '#10b981' : '#ccc',
                    color: 'white',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: file && !loading ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading ? '⏳' : '✅ Importer'}
                </button>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  ← Retour
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2>📖 Chapitres</h2>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="chaptersFile"
              />
              <label htmlFor="chaptersFile" style={{ cursor: 'pointer', display: 'block', marginBottom: '1rem' }}>
                <div style={{
                  padding: '2rem',
                  background: '#ebf8ff',
                  border: '2px dashed #3182ce',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                  <div>{file ? file.name : 'Sélectionnez chapitres.xlsx'}</div>
                </div>
              </label>
              {error && <div style={{ color: '#e53e3e', marginBottom: '1rem' }}>❌ {error}</div>}
              {success && <div style={{ color: '#059669', marginBottom: '1rem' }}>{success}</div>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleImport('chapters')}
                  disabled={!file || loading}
                  style={{
                    flex: 1,
                    background: file && !loading ? '#10b981' : '#ccc',
                    color: 'white',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: file && !loading ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading ? '⏳' : '✅ Importer'}
                </button>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  ← Retour
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2>📊 Quizzes</h2>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="quizzesFile"
              />
              <label htmlFor="quizzesFile" style={{ cursor: 'pointer', display: 'block', marginBottom: '1rem' }}>
                <div style={{
                  padding: '2rem',
                  background: '#ebf8ff',
                  border: '2px dashed #3182ce',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                  <div>{file ? file.name : 'Sélectionnez quizzes.xlsx'}</div>
                </div>
              </label>
              {error && <div style={{ color: '#e53e3e', marginBottom: '1rem' }}>❌ {error}</div>}
              {success && <div style={{ color: '#059669', marginBottom: '1rem' }}>{success}</div>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleImport('quizzes')}
                  disabled={!file || loading}
                  style={{
                    flex: 1,
                    background: file && !loading ? '#10b981' : '#ccc',
                    color: 'white',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: file && !loading ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading ? '⏳' : '✅ Importer'}
                </button>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  ← Retour
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2>✅ Aperçu & Publication</h2>
              <p style={{ color: '#718096', marginBottom: '1.5rem' }}>Tous les éléments sont prêts à être publiés.</p>
              <button
                onClick={handlePublish}
                disabled={loading}
                style={{
                  background: loading ? '#ccc' : '#10b981',
                  color: 'white',
                  padding: '1rem 2rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}
              >
                {loading ? '⏳...' : '🚀 Publier le cours'}
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}