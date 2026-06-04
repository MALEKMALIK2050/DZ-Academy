import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ImportPretestTestPage() {
  const router = useRouter();
  const { id: courseId } = router.query;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    if (!courseId) {
      setError('courseId pas chargé');
      return;
    }

    setLoading(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/api/import/pretest?courseId=${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fileBase64: base64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess(`✅ ${data.created} questions créées`);
        setFile(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!router.isReady || !courseId) return <div style={{ padding: '2rem' }}>⏳ Chargement...</div>;

  return (
    <ProtectedRoute allowedRoles={['DESIGNER']}>
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '2rem' }}>
        <h1>📋 Import Pretest</h1>

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0])}
          style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}
        />

        {error && <div style={{ color: '#e53e3e', marginBottom: '1rem' }}>❌ {error}</div>}
        {success && <div style={{ color: '#059669', marginBottom: '1rem' }}>✅ {success}</div>}

        <button
          onClick={handleUpload}
          disabled={!file || loading || !courseId}
          style={{
            padding: '0.75rem 1.5rem',
            background: file && !loading && courseId ? '#3182ce' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: file && !loading && courseId ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? '⏳ Importer...' : '✅ Importer'}
        </button>
      </div>
    </ProtectedRoute>
  );
}