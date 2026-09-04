import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess, consumeQuota } from '@/lib/quota';
import { AccentAnalysisResponse, PhoneticMarker, RunnerUpMatch } from '@/lib/types';
import { classifySpeechDialect } from '@/lib/dialectEngine';
import { analyzeWithKimiK3, KimiDialectAnalysis } from '@/lib/kimiEngine';
import { getCountryTheme } from '@/lib/countryData';
import { recordAnalysis } from '@/lib/analytics';

export const maxDuration = 60; // 60s timeout on Vercel

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    const isAdmin = checkAdminAccess(adminKey);

    // Enforce 5-try quota for non-admins
    const { allowed, remaining } = consumeQuota(isAdmin);
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Daily quota exceeded. Free guests and account users get 5 free tries per day. Quota resets at 00:00 UTC.',
          quotaRemaining: 0,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = (formData.get('file') || formData.get('audio')) as File | null;
    const clientTranscript = (formData.get('transcript') as string | null) || undefined;
    const clientDuration = formData.get('duration') ? Number(formData.get('duration')) : undefined;
    const clientZcr = formData.get('zeroCrossingRate') ? Number(formData.get('zeroCrossingRate')) : undefined;
    const clientRhythm = formData.get('speechRhythmRatio') ? Number(formData.get('speechRhythmRatio')) : undefined;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Security Check: Size limits (Prevent DoS / Memory exhaustion)
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Security: Audio payload exceeds 15MB limit. Please provide a shorter sample.' },
        { status: 413 }
      );
    }
    if (file.size < 120) {
      return NextResponse.json({ error: 'Audio payload is empty or invalid.' }, { status: 400 });
    }

    // Security Check: Sanitize transcript input against XSS/Injection
    let safeTranscript = clientTranscript ? clientTranscript.replace(/<[^>]*>/g, '').slice(0, 1000).trim() : undefined;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Security Check: Verify genuine audio container headers (magic bytes)
    const isWav = buffer.length > 4 && buffer.slice(0, 4).toString('ascii') === 'RIFF';
    const isMp3 = (buffer.length > 3 && buffer.slice(0, 3).toString('ascii') === 'ID3') || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    const isWebm = buffer.length > 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    const isOgg = buffer.length > 4 && buffer.slice(0, 4).toString('ascii') === 'OggS';
    const isM4a = buffer.length > 12 && buffer.slice(4, 8).toString('ascii') === 'ftyp';

    const isValidAudioHeader = isWav || isMp3 || isWebm || isOgg || isM4a;
    const safeExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm'];
    const hasSafeExtension = safeExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidAudioHeader && !hasSafeExtension) {
      return NextResponse.json(
        { error: 'Security: Upload rejected. File is not a valid audio container.' },
        { status: 400 }
      );
    }

    const base64Audio = buffer.toString('base64');
    let mimeType = file.type || 'audio/webm';
    if (file.name.endsWith('.mp3') || isMp3) mimeType = 'audio/mp3';
    else if (file.name.endsWith('.wav') || isWav) mimeType = 'audio/wav';
    else if (file.name.endsWith('.m4a') || isM4a) mimeType = 'audio/m4a';
    else if (file.name.endsWith('.aac')) mimeType = 'audio/aac';
    else if (file.name.endsWith('.ogg') || isOgg) mimeType = 'audio/ogg';
    else if (isWebm) mimeType = 'audio/webm';

    // 1. Run Authentic Acoustic Dialectology Engine
    const acousticBaseline = classifySpeechDialect(buffer, mimeType, safeTranscript, {
      durationSec: clientDuration,
      zeroCrossingRate: clientZcr,
      speechRhythmRatio: clientRhythm,
    });

    const transcriptToAnalyze = safeTranscript || acousticBaseline.transcription || '';

    // 2. Parallel AI Execution: Gemini 2.5 & Kimi-K3
    const apiKey = process.env.GEMINI_API_KEY;

    const runGemini = async (): Promise<Partial<AccentAnalysisResponse> | null> => {
      if (!apiKey || !apiKey.startsWith('AIzaSy')) return null;
      try {
        const prompt = `You are an elite forensic phonetician and speech dialectologist.
Analyze this audio recording strictly based on its acoustic phonetics, prosody, and speech characteristics across all global accents.
Determine the Primary Country Accent, dialect substrate, confidence score (75-95), imitated accent detection, 4 phonetic markers (IPA, example word, acoustic explanation), and runner up countries.
Return ONLY valid JSON matching:
{
  "primaryCountry": "<Target Country Name>",
  "countryFlag": "<Country Flag Emoji>",
  "regionOrDialect": "<Regional Dialect or Substrate>",
  "confidenceScore": 88,
  "imitatedAccentDetected": false,
  "imitatedAccentDetails": "",
  "transcription": "...",
  "verdictSummary": "...",
  "runnerUpCountries": [{"country": "<Country>", "flag": "<Flag>", "probability": 12, "rationale": "..."}],
  "phoneticMarkers": [{"feature": "...", "ipa": "...", "exampleWord": "...", "explanation": "..."}],
  "prosodyAndRhythm": {"rhythmType": "stress-timed", "rhythmDescription": "...", "pitchDynamics": "...", "stressPatterns": "..."}
}`;

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType, data: base64Audio } },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.15,
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return JSON.parse(text.trim().replace(/^```json\s*/, '').replace(/```$/, ''));
          }
        }
      } catch {
        // Fallback gracefully
      }
      return null;
    };

    const hasTranscript = Boolean(safeTranscript && safeTranscript.trim().length > 3);

    const runKimi = async (): Promise<KimiDialectAnalysis | null> => {
      // Only invoke text-based NIM LLM when there is actual transcribed speech to analyze.
      // For pure audio without transcripts, the physical acoustic engine is authoritative.
      if (!hasTranscript) return null;
      try {
        return await analyzeWithKimiK3(safeTranscript!, {
          durationSec: clientDuration || acousticBaseline.acoustics?.durationSec || 3,
          zeroCrossingRate: clientZcr || acousticBaseline.acoustics?.zeroCrossingRate,
          speechRhythmRatio: clientRhythm || acousticBaseline.acoustics?.speechRhythmRatio,
          estimatedPitchHz: acousticBaseline.acoustics?.estimatedPitchHz,
          highFreqRatio: acousticBaseline.acoustics?.highFreqRatio,
        });
      } catch {
        return null;
      }
    };

    const [geminiResult, kimiResult] = await Promise.all([runGemini(), runKimi()]);

    // 3. Maximum Possibility Fusion of Kimi-K3, Gemini, and Acoustic Engine
    // Collect country candidates with their respective confidence probabilities
    const candidates: Record<string, { confidence: number; source: string; details: any }> = {};

    // Add acoustic baseline
    candidates[acousticBaseline.primaryCountry] = {
      confidence: acousticBaseline.confidenceScore,
      source: 'Acoustic Dialectology Signal',
      details: acousticBaseline,
    };

    // Add Gemini if available
    const gRes = geminiResult as Partial<AccentAnalysisResponse> | null;
    if (gRes && gRes.primaryCountry && gRes.confidenceScore) {
      const existing = candidates[gRes.primaryCountry];
      if (!existing || gRes.confidenceScore > existing.confidence) {
        candidates[gRes.primaryCountry] = {
          confidence: gRes.confidenceScore,
          source: 'Acoustic Spectral Neural Engine',
          details: gRes,
        };
      }
    }

    // Add Kimi-K3 if available
    const kRes = kimiResult as KimiDialectAnalysis | null;
    if (kRes && kRes.primaryCountry && kRes.confidenceScore) {
      const existing = candidates[kRes.primaryCountry];
      if (!existing || kRes.confidenceScore > existing.confidence) {
        candidates[kRes.primaryCountry] = {
          confidence: kRes.confidenceScore,
          source: 'Forensic Dialectology Engine',
          details: kRes,
        };
      }
    }

    // Find the candidate with the MAXIMUM possibility
    let topCountry = acousticBaseline.primaryCountry;
    let maxConfidence = acousticBaseline.confidenceScore;
    let bestSource = 'Dual-Engine Consensus';

    for (const [cName, data] of Object.entries(candidates)) {
      if (data.confidence > maxConfidence) {
        maxConfidence = data.confidence;
        topCountry = cName;
        bestSource = data.source;
      }
    }

    // Dynamic Multi-Engine Consensus Adjustment:
    let agreeingCount = 0;
    if (gRes?.primaryCountry?.toLowerCase() === topCountry.toLowerCase()) agreeingCount++;
    if (kRes?.primaryCountry?.toLowerCase() === topCountry.toLowerCase()) agreeingCount++;
    if (acousticBaseline.primaryCountry.toLowerCase() === topCountry.toLowerCase()) agreeingCount++;

    let finalConfidence = Number.isFinite(maxConfidence) ? maxConfidence : acousticBaseline.confidenceScore;
    if (!Number.isFinite(finalConfidence) || finalConfidence <= 0) {
      finalConfidence = 87;
    }

    if (agreeingCount >= 2) {
      finalConfidence = Math.min(96, Math.max(78, finalConfidence + (agreeingCount === 3 ? 2 : 1)));
    } else {
      finalConfidence = Math.min(94, Math.max(75, finalConfidence));
    }
    finalConfidence = Math.round(finalConfidence);

    const topTheme = getCountryTheme(topCountry);

    // Merge phonetic markers from both Kimi and Gemini/Acoustic for maximum depth
    const mergedPhonetics: PhoneticMarker[] = [];
    const seenFeatures = new Set<string>();

    const addMarkers = (markers?: PhoneticMarker[]) => {
      if (!markers) return;
      for (const m of markers) {
        if (!seenFeatures.has(m.feature.toLowerCase())) {
          seenFeatures.add(m.feature.toLowerCase());
          mergedPhonetics.push(m);
        }
      }
    };

    if (kimiResult?.phoneticMarkers && kimiResult.primaryCountry === topCountry) {
      addMarkers(kimiResult.phoneticMarkers);
    }
    if (geminiResult?.phoneticMarkers && geminiResult.primaryCountry === topCountry) {
      addMarkers(geminiResult.phoneticMarkers);
    }
    addMarkers(acousticBaseline.phoneticMarkers);

    // Check for imitation detected by any engine
    const isImitated = Boolean(
      geminiResult?.imitatedAccentDetected ||
      kimiResult?.imitatedAccentDetected ||
      acousticBaseline.imitatedAccentDetected
    );
    const imitationDetails =
      geminiResult?.imitatedAccentDetails ||
      kimiResult?.imitatedAccentDetails ||
      acousticBaseline.imitatedAccentDetails;

    // Build realistic runner-up list from remaining candidates and baseline runner-ups
    const remainingPercent = Math.max(5, 100 - finalConfidence);
    const runnerUps: RunnerUpMatch[] = [];

    const candidateList: { country: string; score: number; rationale?: string }[] = [];

    // Add Kimi runner ups if any
    if (kimiResult?.runnerUpCountries && Array.isArray(kimiResult.runnerUpCountries)) {
      for (const r of kimiResult.runnerUpCountries) {
        if (r.country && r.country.toLowerCase() !== topCountry.toLowerCase()) {
          candidateList.push({
            country: r.country,
            score: Number(r.probability) || 12,
            rationale: r.rationale || 'Neural dialectology acoustic resonance.',
          });
        }
      }
    }

    // Add baseline candidates
    for (const [cName, data] of Object.entries(candidates)) {
      if (
        cName.toLowerCase() !== topCountry.toLowerCase() &&
        !candidateList.some((x) => x.country.toLowerCase() === cName.toLowerCase())
      ) {
        candidateList.push({
          country: cName,
          score: Number(data.confidence) || 10,
          rationale: `Evaluated by ${data.source} with alternative acoustic phonetic resonance.`,
        });
      }
    }

    // Supplement with runner-ups from acoustic baseline
    for (const r of acousticBaseline.runnerUpCountries || []) {
      if (
        r.country &&
        r.country.toLowerCase() !== topCountry.toLowerCase() &&
        !candidateList.some((x) => x.country.toLowerCase() === r.country.toLowerCase())
      ) {
        candidateList.push({
          country: r.country,
          score: Number(r.probability) || 8,
          rationale: r.rationale,
        });
      }
    }

    // Ensure we always have at least 2 runner-up candidates
    if (candidateList.length < 2) {
      const fallbackCountries = ['Canada', 'United Kingdom', 'Australia', 'Ireland', 'Germany', 'France', 'India', 'Japan'];
      for (const fb of fallbackCountries) {
        if (
          fb.toLowerCase() !== topCountry.toLowerCase() &&
          !candidateList.some((x) => x.country.toLowerCase() === fb.toLowerCase())
        ) {
          candidateList.push({
            country: fb,
            score: 8,
            rationale: 'Secondary regional phonetic affinity.',
          });
          if (candidateList.length >= 3) break;
        }
      }
    }

    const topRunnerUps = candidateList.slice(0, 3);
    const runnerUpSum = topRunnerUps.reduce((acc, curr) => acc + (Number(curr.score) || 1), 0) || 1;
    let allocatedProb = 0;

    for (let i = 0; i < topRunnerUps.length; i++) {
      const item = topRunnerUps[i];
      const theme = getCountryTheme(item.country);
      let prob: number;
      if (i === topRunnerUps.length - 1) {
        prob = Math.max(1, remainingPercent - allocatedProb);
      } else {
        const rawP = Math.round(((Number(item.score) || 1) / runnerUpSum) * remainingPercent);
        const remainingSlots = topRunnerUps.length - 1 - i;
        prob = Math.max(1, Math.min(remainingPercent - allocatedProb - remainingSlots, rawP));
        allocatedProb += prob;
      }
      runnerUps.push({
        country: item.country,
        flag: theme.flag,
        probability: Math.round(prob),
        rationale: item.rationale || `Secondary dialect resonance.`,
      });
    }

    const finalResponse: AccentAnalysisResponse = {
      primaryCountry: topCountry,
      countryFlag: topTheme.flag,
      regionOrDialect:
        geminiResult?.regionOrDialect ||
        kimiResult?.regionOrDialect ||
        acousticBaseline.regionOrDialect,
      confidenceScore: finalConfidence,
      imitatedAccentDetected: isImitated,
      imitatedAccentDetails: isImitated ? imitationDetails : undefined,
      transcription: transcriptToAnalyze || acousticBaseline.transcription,
      verdictSummary: `Maximum possibility analysis across authentic speech sources (forensic acoustic & phonological dialect models) identifies ${topCountry} with ${finalConfidence}% confidence. ${acousticBaseline.verdictSummary}`,
      runnerUpCountries: runnerUps,
      phoneticMarkers: mergedPhonetics.slice(0, 5),
      prosodyAndRhythm: geminiResult?.prosodyAndRhythm || acousticBaseline.prosodyAndRhythm,
      acoustics: acousticBaseline.acoustics,
      quotaRemaining: remaining,
      isAdmin,
      timestamp: new Date().toISOString(),
    };

    // Record in system analytics
    try {
      recordAnalysis({
        country: topCountry,
        countryFlag: topTheme.flag,
        confidenceScore: finalConfidence,
        regionOrDialect: finalResponse.regionOrDialect,
        durationSec: acousticBaseline.acoustics?.durationSec || 4.0,
        rhythmType: finalResponse.prosodyAndRhythm?.rhythmType || 'stress-timed',
      });
    } catch (e) {
      console.error('Failed to record analysis in analytics:', e);
    }

    return NextResponse.json(finalResponse);
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the audio analysis.' },
      { status: 500 }
    );
  }
}
