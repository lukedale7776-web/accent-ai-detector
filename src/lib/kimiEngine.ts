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
 * Standardized on meta/llama-3.2-11b-vision-instruct (proven 1-2s response)
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
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) return null;

  const durationStr = (acoustics.durationSec || 3).toFixed(1);
  const zcrStr = (acoustics.zeroCrossingRate || 0.14).toFixed(3);
  const rhythmVal = acoustics.speechRhythmRatio || 0.24;
  const rhythmStr = rhythmVal.toFixed(3);
  const pitchStr = Math.round(acoustics.estimatedPitchHz || 140);
  const rhythmClass = rhythmVal > 0.31 ? 'Stress-Timed' : rhythmVal < 0.22 ? 'Syllable-Timed' : 'Mora-Timed / Mixed';

  const prompt = `You are an expert speech phonetician and global acoustic dialectologist.
You base your dialectological decisions on empirical sociolinguistic and phonetic research frameworks:
1. J.C. Wells (1982) "Accents of English" (Lexical Sets):
   - TRAP-BATH split: Broad [ɑː] in RP, Australia, New Zealand, South Africa vs short [æ] in General American, Canada, and Northern England.
   - FOOT-STRUT split: Northern English preserves [ʊ] for both; RP/GA split to [ʊ] and [ʌ].
   - LOT-CLOTH split & LOT-THOUGHT merger (Father-Bother merger).
   - GOOSE fronting: Extreme fronting [ʉː] in Modern RP/Australian; back [uː] in General American.
   - FLEECE diphthongization: Broad Australian [əi] / [ɪi] vs American/RP [iː].
   - PRICE & MOUTH shifts: Australian/NZ front-raising (PRICE [ɑe]/[ɒe], MOUTH [æɔ]/[æʊ]).
   - Canadian Raising: Raising of /aɪ/ and /aʊ/ nuclei to [ʌɪ] and [ʌʊ] before voiceless consonants.
2. Labov, Ash & Boberg (2006) ANAE:
   - Northern Cities Vowel Shift (NCVS: TRAP raising [ɛə], LOT fronting [a], THOUGHT lowering [ɒ]).
   - Southern Vowel Shift (PRICE monophthongization [aː], pin-pen merger).
   - Rhoticity: Postvocalic /r/ ([ɹ]) retention with sharp F3 suppression.
3. Peterson & Barney / Hillenbrand Formant Correlates:
   - Formant 3 (F3) Rhoticity Cue: Contextual F3 lowering in rhotic accents (US, Canada, Ireland, Scotland, dipping toward ~1800-2200 Hz relative to speaker vocal tract baseline) vs elevated F3 (> 2400-2600 Hz) in non-rhotic accents (RP/Estuary, Australia, New Zealand, South Africa, Caribbean). Note: Evaluate F3 as a relative contextual indicator rather than a rigid universal threshold.
4. Lisker & Abramson VOT & Consonant Landmarks:
   - Aspirated fortis plosives (VOT > 65ms in Anglophone GA/RP/Aus) vs unaspirated plosives (VOT < 25ms in South Asian, Romance, African varieties).
   - Retroflex plosives [ʈ], [ɖ] and retroflex flap [ɽ] characteristic of South Asian / Indian English substrate.
   - Dental stops [t̪], [d̪] replacing dental fricatives /θ, ð/ in South Asian, French, Italian, Spanish substrates.
   - Intervocalic /t/: Flapping [ɾ] in North American/Australian vs glottaling [ʔ] in British Estuary.
5. Grabe & Low / Deterding nPVI Isochrony:
   - Stress-timed (high vocalic nPVI > 55): Heavy unstressed vowel reduction to schwa [ə] (British, American, German).
   - Syllable-timed (low vocalic nPVI < 45): Equal syllable duration, full vowel retention (Indian, Nigerian, Singaporean, Jamaican, Spanish substrate).
   - Mora-timed: Japanese English with vowel epenthesis [ɯ, o].

Analyze the following speech sample parameters:

${transcript ? `SPEECH TRANSCRIPT: "${transcript}"` : 'AUDIO ONLY (NO TRANSCRIPT AVAILABLE - INFER DIALECT STRICTLY FROM ACOUSTIC PHONETIC METRICS)'}
ACOUSTIC SIGNAL MEASUREMENTS:
- Recording Duration: ${durationStr} seconds
- Zero Crossing Rate (Aspiration & Fricative Energy): ${zcrStr}
- Syllabic Rhythm Index: ${rhythmStr} (Classification: ${rhythmClass})
- Fundamental Frequency F0: ${pitchStr} Hz

CRITICAL GUIDELINES:
- Distinguish globally across ALL accents: United States, United Kingdom, Australia, Canada, India, Pakistan, Nigeria, South Africa, Ireland, New Zealand, Germany, France, Spain, Italy, Mexico, Brazil, Japan, China, Russia, Sweden, Jamaica, Philippines, etc.
- If a transcript is present, deeply evaluate regional idioms, lexical slang, rhotic vs non-rhotic vowel shifts, and dental vs retroflex stops.
- If NO transcript is present, use the acoustic cadence: Syllable-timed indicates Romance/South Asian/African languages; Stress-timed indicates Germanic/Anglophone; Mora-timed indicates East Asian.
- DO NOT default to United States unless acoustic rhoticity and lexical markers specifically indicate General American or a US regional dialect.
- Determine if the speaker is imitating or faking an accent.

Return strictly a single JSON object with this structure (no markdown fences, no conversational text):
{
  "primaryCountry": "<Determined country name, e.g. Australia, India, France, Germany, United Kingdom, United States, Japan, Brazil, etc.>",
  "countryFlag": "<Country emoji flag>",
  "regionOrDialect": "<Precise dialect or substrate, e.g. General Australian, Indo-Aryan Substrate English, French-Substrate English, Modern RP / Southern British, etc.>",
  "confidenceScore": 86,
  "imitatedAccentDetected": false,
  "imitatedAccentDetails": "",
  "verdictSummary": "<Precise 2-sentence acoustic dialectology summary>",
  "phoneticMarkers": [
    {
      "feature": "<Specific phonological feature>",
      "ipa": "<IPA symbol>",
      "exampleWord": "<Example word>",
      "explanation": "<Acoustic explanation>"
    }
  ],
  "runnerUpCountries": [
    {
      "country": "<Runner-up country>",
      "flag": "<Emoji flag>",
      "probability": 14,
      "rationale": "<Phonetic similarity rationale>"
    }
  ]
}`;

  const candidateModels = [
    'meta/llama-3.2-11b-vision-instruct',
    'meta/llama-3.1-70b-instruct',
    'meta/llama-3.2-3b-instruct',
    'mistralai/mistral-large-2-instruct',
  ];

  for (const m of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

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
                'You are an expert speech phonetician and dialectologist. Always respond strictly in valid raw JSON with zero markdown or conversational intro.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 380,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const msg = data.choices?.[0]?.message;
        let rawContent = msg?.content;
        if (!rawContent && msg?.reasoning_content) {
          rawContent = msg.reasoning_content;
        }

        if (rawContent) {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.primaryCountry && typeof parsed.primaryCountry === 'string') {
              const conf = Number(parsed.confidenceScore);
              return {
                primaryCountry: parsed.primaryCountry.trim(),
                countryFlag: parsed.countryFlag || '🌐',
                regionOrDialect: parsed.regionOrDialect || `${parsed.primaryCountry} Dialect`,
                confidenceScore: Number.isFinite(conf) ? Math.min(95, Math.max(75, Math.round(conf))) : 85,
                imitatedAccentDetected: Boolean(parsed.imitatedAccentDetected),
                imitatedAccentDetails: parsed.imitatedAccentDetails || '',
                verdictSummary: parsed.verdictSummary || `Acoustic and phonological markers identify ${parsed.primaryCountry}.`,
                phoneticMarkers: Array.isArray(parsed.phoneticMarkers) ? parsed.phoneticMarkers : [],
                runnerUpCountries: Array.isArray(parsed.runnerUpCountries) ? parsed.runnerUpCountries.map((r: any) => ({
                  country: String(r.country || '').trim(),
                  flag: r.flag || '🌐',
                  probability: Number.isFinite(Number(r.probability)) ? Math.round(Number(r.probability)) : 10,
                  rationale: String(r.rationale || ''),
                })) : [],
              };
            }
          }
        }
      }
    } catch {
      // Try next model if timeout or network failure
    }
  }

  return null;
}


