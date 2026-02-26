import { useState } from 'react';

export function useDesignAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState('');

  const analyzeImage = async (file: File, analysisId: string) => {
    setLoading(true);
    setError(null);
    setStage('Extracting colors & uploading...');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('analysisId', analysisId);

      setStage('Running AI vision analysis...');
      const res = await fetch('/api/analyze/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Image analysis failed');
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      setStage('');
    }
  };

  const analyzeWeb = async (url: string, analysisId: string) => {
    setLoading(true);
    setError(null);
    setStage('Launching browser...');

    try {
      setStage('Scraping page & extracting CSS...');
      const res = await fetch('/api/analyze/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, analysisId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Web analysis failed');
      }

      setStage('Running AI design analysis...');
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      setStage('');
    }
  };

  return { loading, error, stage, analyzeImage, analyzeWeb };
}
