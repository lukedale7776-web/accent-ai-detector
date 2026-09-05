import { PraatFeatures } from './types';

export interface PraatAnalysisResponse {
  success: boolean;
  features?: PraatFeatures;
  error?: string;
}

/**
 * Sends an audio buffer to the local/remote Praat Parselmouth Python microservice.
 * Falls back gracefully to null if the microservice is offline or times out.
 */
export async function analyzeWithPraat(
  audioBuffer: Buffer,
  fileName: string = 'audio.wav'
): Promise<PraatFeatures | null> {
  let baseUrl = (process.env.PRAAT_SERVICE_URL || 'http://localhost:8001').trim();
  // Strip trailing slash if present
  baseUrl = baseUrl.replace(/\/+$/, '');
  const endpoint = baseUrl.endsWith('/analyze') ? baseUrl : `${baseUrl}/analyze`;

  try {
    const formData = new FormData();
    // In Node.js environment, convert Buffer to Uint8Array for Blob compatibility
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
    formData.append('file', blob, fileName);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.warn(`[Praat Service] Returned status ${res.status}: ${errorText.slice(0, 100)}`);
      return null;
    }

    const data: PraatAnalysisResponse = await res.json();
    if (data.success && data.features) {
      console.log(
        `[Praat Service] Successfully extracted features: F0=${data.features.pitch.mean_hz?.toFixed(1)}Hz, ` +
        `F1=${data.features.formants.f1_mean?.toFixed(0)}Hz, F2=${data.features.formants.f2_mean?.toFixed(0)}Hz`
      );
      return data.features;
    }

    if (data.error) {
      console.warn(`[Praat Service] Error response: ${data.error}`);
    }
    return null;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('[Praat Service] Request timed out after 6000ms');
    } else {
      console.warn(`[Praat Service] Unreachable or offline (${err?.message || err})`);
    }
    return null;
  }
}
