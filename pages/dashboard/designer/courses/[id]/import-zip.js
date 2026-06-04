import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ImportZipPage() {
  const router = useRouter();
  const { id: courseId } = router.query;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpload = async () => {
    if (!file) {
      setError('Sélectionnez un fichier ZIP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/api/import/upload-zip?courseId=${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fileBase64: base64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setSuccess('✅ Cours importé avec succès!');
      setTimeout(() => {
        router.push(`/dashboard/designer/courses/${courseId}`);
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!router.isReady) return <div style={{ padding: '2rem' }}>⏳</div>;

  return (
    <ProtectedRoute allowedRoles={['DESIGNER']}>
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '2rem' }}>
        <h1>📦 Import ZIP Complet</h1>

        <div style={{
          background: 'white',
          border: '2px dashed #7c3aed',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '1rem',
        }}>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files?.[0])}
            style={{ display: 'none' }}
            id="zipFile"
          />
          <label htmlFor="zipFile" style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
            <div style={{ fontWeight: '600' }}>{file ? file.name : 'Sélectionnez course.zip'}</div>
            <div style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
              Doit contenir: pretest.xlsx, chapters.xlsx, quizzes.xlsx
            </div>
          </label>
        </div>

        {error && <div style={{ color: '#e53e3e', marginBottom: '1rem' }}>❌ {error}</div>}
        {success && <div style={{ color: '#059669', marginBottom: '1rem' }}>✅ {success}</div>}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: file && !loading ? '#7c3aed' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: file && !loading ? 'pointer' : 'not-allowed',
            fontWeight: '600',
          }}
        >
          {loading ? '⏳ Import...' : '✅ Importer'}
        </button>

        <button
          onClick={() => router.back()}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#f97316',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            marginTop: '0.5rem',
          }}
        >
          ← Retour
        </button>
      </div>
    </ProtectedRoute>
  );
}