import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PretestPage() {
  const router = useRouter();
  const { id: courseId } = router.query;
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    fetchPretest();
  }, [courseId]);

  const fetchPretest = async () => {
    try {
      const res = await fetch(`/api/pretest/${courseId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [current.id]: value });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Répondez à toutes les questions');
      return;
    }

    try {
      const res = await fetch(`/api/student/submit-pretest?courseId=${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (res.ok) {
        setScore(data.score);
        setSubmitted(true);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>⏳ Chargement...</div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div style={{ padding: '2rem', color: '#e53e3e' }}>❌ {error}</div>
      </ProtectedRoute>
    );
  }

  if (questions.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>Aucun pretest</div>
      </ProtectedRoute>
    );
  }

  if (submitted) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div style={{ maxWidth: '600px', margin: '100px auto', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h1>Pretest terminé!</h1>
          <div style={{
            background: '#f0fff4',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '2px solid #10b981',
          }}>
            <p style={{ fontSize: '0.9rem', color: '#718096', margin: '0 0 0.5rem' }}>Votre score</p>
            <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#059669', margin: 0 }}>{score}%</p>
          </div>
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            style={{
              width: '100%',
              padding: '1rem',
              background: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
            }}
          >
            ✅ Commencer le cours
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 1rem' }}>📋 Pretest</h1>
          <p style={{ color: '#718096', margin: 0 }}>Question {currentIndex + 1} sur {questions.length}</p>
        </div>

        {/* PROGRESS BAR */}
        <div style={{
          background: '#e2e8f0',
          height: '8px',
          borderRadius: '4px',
          marginBottom: '2rem',
          overflow: 'hidden',
        }}>
          <div style={{
            background: '#3182ce',
            height: '100%',
            width: `${progress}%`,
            transition: 'width 0.3s',
          }} />
        </div>

        {/* QUESTION */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem',
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            {current.question}
          </h2>

          {/* RÉPONSES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {current.options && current.options.map((option, idx) => (
              <label
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  background: answers[current.id] === option ? '#ebf8ff' : '#f8fafc',
                  border: `2px solid ${answers[current.id] === option ? '#3182ce' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name={`q${current.id}`}
                  value={option}
                  checked={answers[current.id] === option}
                  onChange={() => handleAnswer(option)}
                  style={{ marginRight: '1rem', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: answers[current.id] === option ? '600' : '400' }}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* BOUTONS NAVIGATION */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            style={{
              flex: 1,
              padding: '1rem',
              background: currentIndex === 0 ? '#e2e8f0' : '#718096',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '600',
            }}
          >
            ← Précédent
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={!answers[current.id]}
              style={{
                flex: 1,
                padding: '1rem',
                background: !answers[current.id] ? '#e2e8f0' : '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: !answers[current.id] ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              ✅ Soumettre
            </button>
          )}
        </div>

        {/* INDICATEUR RÉPONSES */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '8px',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}>
          {questions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid #e2e8f0',
                background: answers[q.id] ? '#10b981' : '#f8fafc',
                color: answers[q.id] ? 'white' : '#718096',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}