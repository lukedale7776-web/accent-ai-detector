import { AccentAnalysisResponse } from './types';

export interface KimiDialectAnalysis {
  primaryCountry: string;
  countryFlag?: string;
  regionOrDialect: string;
  confidenceScore: number;
  imitatedAccentDetected: boolean;
  imitatedAccentDetails?: string;
  verdictSummary: string;
  phoneticMarkers: Array<{
    feature: string;
    ipa: string;
    exampleWord: string;
    explanation: string;
  }>;
  runnerUpCountries: Array<{
    country: string;
    flag: string;
    probability: number;
    rationale: string;
  }>;
}

/**
 * Executes NVIDIA NIM neural dialectology analysis
 * Uses meta/llama-3.2-11b-vision-instruct (proven 1-2s response) and moonshotai/kimi-k3
 */
export async function analyzeWithKimiK3(
  transcript: string,
  acoustics: {
    durationSec?: number;
    zeroCrossingRate?: number;
    speechRhythmRatio?: number;
    estimatedPitchHz?: number;
    highFreqRatio?: number;
  }
): Promise<KimiDialectAnalysis | null> {
  const apiKey =
    process.env.NVIDIA_API_KEY ||
    '-2Bsy9s0_ri26gvw9yXsdnaJx_K08rLJqEF-a6SAchND89o4FbqlolDsHcpIa0';

  if (!apiKey) return null;

  const durationStr = (acoustics.durationSec || 3).toFixed(1);
  const zcrStr = (acoustics.zeroCrossingRate || 0.22).toFixed(3);
  const rhythmStr = (acoustics.speechRhythmRatio || 0.28).toFixed(3);
  const pitchStr = Math.round(acoustics.estimatedPitchHz || 135);

  const prompt = `You are a forensic acoustic phonetician and speech dialectologist.
Analyze the following speech sample parameters:

${transcript ? `SPEECH TRANSCRIPT: "${transcript}"` : 'NO TRANSCRIPT AVAILABLE - PURE ACOUSTIC SIGNAL'}
ACOUSTIC MEASUREMENTS:
- Duration: ${durationStr} seconds
- Zero Crossing Rate (Aspiration/Frication proxy): ${zcrStr}
- Syllabic Rhythm Index: ${rhythmStr} (${(acoustics.speechRhythmRatio || 0.28) > 0.32 ? 'Stress-Timed' : (acoustics.speechRhythmRatio || 0.28) < 0.22 ? 'Syllable-Timed' : 'Mixed/Mora-Timed'})
- Fundamental Frequency F0: ${pitchStr} Hz

Determine:
1. Primary Country: Exact country (e.g. "United States", "United Kingdom", "Australia", "Canada", "India", "Pakistan", "Nigeria", "Ireland", "Germany", "France", "Spain", "Italy", "Mexico", "Brazil", "Japan", "China", "Russia", "Sweden", "Jamaica", etc.) and country flag emoji.
2. Dialect / Substrate: (e.g. "General American", "Modern RP / Southern British", "General Australian", "Nordic Scandinavian-Substrate English", "Castilian / Spanish-Substrate", "General Indian English / Indo-Aryan Substrate").
3. Confidence Score: Integer 75 to 95.
4. Imitated Accent Detection: Boolean and explanation if the speaker attempts surface slang over native acoustic substrate.
5. 3-4 Specific Phonetic Markers with IPA symbols, example words, and acoustic explanation.
6. Runner-up candidate countries with probability percentages totaling 100 - confidenceScore.
7. Concise 2-sentence verdict summary.

Return ONLY a valid JSON object (no markdown formatting, no code blocks):
{
  "primaryCountry": "United States",
  "countryFlag": "🇺🇸",
  "regionOrDialect": "General American",
  "confidenceScore": 88,
  "imitatedAccentDetected": false,
  "imitatedAccentDetails": "",
  "verdictSummary": "Acoustic and phonological markers identify...",
  "phoneticMarkers": [
    {
      "feature": "Rhotic Post-Vocalic Coda",
      "ipa": "[ɹ]",
      "exampleWord": "car",
      "explanation": "Pronounced retroflex tongue blade posture lowering F3."
    }
  ],
  "runnerUpCountries": [
    {
      "country": "Canada",
      "flag": "🇨🇦",
      "probability": 12,
      "rationale": "Shares North American rhoticity."
    }
  ]
}`;

  // Prioritize fast, reliable models on this NVIDIA NIM endpoint
  const candidateModels = [
    'meta/llama-3.2-11b-vision-instruct',
    'moonshotai/kimi-k3',
  ];

  for (const m of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500); // 6.5s timeout

      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: m,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert forensic dialectologist. Always respond strictly in valid raw JSON with zero markdown or conversational intro.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.12,
          max_tokens: 650,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const msg = data.choices?.[0]?.message;
        let rawContent = msg?.content;
        // Check reasoning_content if content is empty (e.g. Kimi-K3)
        if (!rawContent && msg?.reasoning_content) {
          rawContent = msg.reasoning_content;
        }

        if (rawContent) {
          // Extract JSON block if wrapped
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.primaryCountry && parsed.confidenceScore) {
              return parsed as KimiDialectAnalysis;
            }
          }
        }
      }
    } catch {
      // Fallback to next model
    }
  }

  return null;
}

