import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

export default function UploadExcelPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📄 Conversion fichier...');
      const base64 = await fileToBase64(file);
      console.log('✅ Base64 prêt');

      console.log('📤 Envoi...');
      const res = await fetch('/api/import-course/upload-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, fileName: file.name }),
      });

      console.log('📨 Réponse:', res.status);
      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess(`✅ ${result.data.chapitres.length} ch`);
      setFile(null);
      setLoading(false);
    } catch (err) {
      console.error('❌', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['DESIGNER']}>
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '2rem' }}>
        <h1>📊 Upload</h1>

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0])}
          style={{ marginBottom: '1rem' }}
        />
<button
  onClick={() => router.push(`/courses/${courseId}/import-chapters`)}
  style={{
    width: '100%',
    padding: '0.75rem',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '1rem',
  }}
>
  📖 Créer chapitres
</button>

<button
  onClick={() => router.push(`/dashboard/designer/courses/${courseId}`)}
  style={{
    width: '100%',
    padding: '0.75rem',
    background: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '0.5rem',
  }}
>
  ✅ Retour cours
</button>


        {error && <div style={{ color: '#e53e3e', marginBottom: '1rem' }}>❌ {error}</div>}
        {success && <div style={{ color: '#059669', marginBottom: '1rem' }}>{success}</div>}
        {loading && <div style={{ color: '#666', marginBottom: '1rem' }}>⏳ Traitement...</div>}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            padding: '0.75rem',
            background: file && !loading ? '#3182ce' : '#ccc',
            color: 'white',
            border: 'none',
            cursor: file && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          Upload
        </button>
      </div>
    </ProtectedRoute>
  );
}