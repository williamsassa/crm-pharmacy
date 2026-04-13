'use client';

import { useState } from 'react';

export default function NvidiaTestPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/nvidia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'appel à l'API");
      }

      const data = await res.json();
      setResponse(data.result || 'Aucune réponse');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}
    >
      <h1>Test NVIDIA API</h1>

      <textarea
        rows={4}
        placeholder="Entrez votre prompt ici..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ width: '100%', padding: 10 }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !prompt}
        style={{
          marginTop: 10,
          padding: '8px 16px',
          cursor: 'pointer',
        }}
      >
        {loading ? 'Chargement...' : 'Envoyer'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

      {response && (
        <div style={{ marginTop: 20 }}>
          <h3>Réponse :</h3>
          <pre
            style={{
              background: '#f4f4f4',
              padding: 10,
              whiteSpace: 'pre-wrap',
            }}
          >
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
