import { useState } from 'react';

export default function ImportCoursePage() {
  const [file, setFile] = useState(null);
  const [designerId, setDesignerId] = useState('7');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (['pdf', 'docx'].includes(ext)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Format non supporté. Utilisez PDF ou DOCX.');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !designerId) {
      setError('Fichier et designerId requis');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ÉTAPE 1: Upload
      console.log('📤 Upload du fichier...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('designerId', designerId);

      const uploadResponse = await fetch('/api/import-course/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || 'Erreur upload');
      }

      const uploadData = await uploadResponse.json();
      console.log('✅ Upload réussi:', uploadData);

      // ÉTAPE 2: Process
      console.log('⚙️ Traitement du fichier...');
      const processResponse = await fetch('/api/import-course/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filepath: uploadData.file.filepath,
          designerId: parseInt(designerId),
        }),
      });

      if (!processResponse.ok) {
        const processError = await processResponse.json();
        throw new Error(processError.error || 'Erreur traitement');
      }

      const processData = await processResponse.json();
      console.log('✅ Traitement réussi:', processData);

      setResult(processData);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h1>📚 Import de Cours</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Designer ID:
            <input
              type="number"
              value={designerId}
              onChange={(e) => setDesignerId(e.target.value)}
              style={{
                display: 'block',
                padding: '8px',
                marginTop: '5px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Fichier (PDF ou DOCX):
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx"
              style={{
                display: 'block',
                padding: '8px',
                marginTop: '5px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </label>
          {file && <p style={{ color: 'green' }}>✅ {file.name} sélectionné</p>}
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#073c31',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            width: '100%',
          }}
        >
          {loading ? '⏳ Traitement en cours...' : '🚀 Importer le cours'}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f3e6e7',
            color: '#952f39',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          ❌ Erreur: {error}
        </div>
      )}

{result && (
  <div style={{
    padding: '15px',
    backgroundColor: '#d4edda',
    color: '#3ed160',
    borderRadius: '4px',
  }}>
    <h2>✅ Cours créé avec succès!</h2>
    
    <div style={{ marginTop: '15px', borderBottom: '2px solid #155724', paddingBottom: '15px' }}>
      <h3>📚 Informations du cours</h3>
      <p><strong>Titre:</strong> {result.course.title}</p>
      <p><strong>Matière:</strong> {result.course.matiere}</p>
      <p><strong>Niveau:</strong> {result.course.niveau}</p>
      <p><strong>Année:</strong> {result.course.annee}</p>
      <p><strong>ID:</strong> {result.course.id}</p>
      <p><strong>Description:</strong> {result.course.description}</p>
      <p><strong>Statut:</strong> {result.course.status}</p>
      
      <div style={{ marginTop: '10px' }}>
        <strong>Objectifs:</strong>
        <ul style={{ marginTop: '5px' }}>
          {result.course.objectifs && result.course.objectifs.map((obj, idx) => (
            <li key={idx}>{obj}</li>
          ))}
        </ul>
      </div>
    </div>

    <div style={{ marginTop: '15px', borderBottom: '2px solid #155724', paddingBottom: '15px' }}>
      <h3>📖 Chapitres créés ({result.chapters.length})</h3>
      <ul style={{ marginTop: '10px' }}>
        {result.chapters.map((chapter) => (
        <li key={chapter.id} style={{ marginBottom: '10px' }}>
          <strong>{chapter.title}</strong>
        </li>
        ))}
      </ul>
    </div>

    <div style={{ marginTop: '15px' }}>
      <h3>📊 Statistiques</h3>
      <p><strong>Total Chapitres:</strong> {result.statistics.totalChapters}</p>
      <p><strong>Total Supports:</strong> {result.statistics.totalSupports}</p>
      {result.statistics.supportsByType && Object.entries(result.statistics.supportsByType).map(([type, count]) => (
        <p key={type} style={{ marginLeft: '20px' }}>
          • {type}: {count}
        </p>
      ))}
      <p><strong>Quiz Formatifs:</strong> {result.statistics.totalQuizFormatif}</p>
      <p><strong>Devoirs:</strong> {result.statistics.totalDevoirs}</p>
      <p><strong>Quiz Sommatif:</strong> {result.statistics.hasQuizSommatif ? 'Oui' : 'Non'}</p>
    </div>
  </div>
)}

      {!result && !error && (
        <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
          <p>📝 Sélectionnez un fichier PDF ou DOCX pour importer automatiquement un cours.</p>
          <p style={{ fontSize: '12px', color: '#169066' }}>
            • Le système extrait le texte<br />
            • OpenAI génère la structure<br />
            • Les données sont créées en base de données
          </p>
        </div>
      )}
    </div>
  );
}
