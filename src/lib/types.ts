export interface PhoneticMarker {
  feature: string;
  ipa: string;
  exampleWord: string;
  explanation: string;
}

export interface RunnerUpMatch {
  country: string;
  flag: string;
  probability: number;
  rationale: string;
}

export interface ProsodicMetrics {
  rhythmType: 'syllable-timed' | 'stress-timed' | 'mixed';
  rhythmDescription: string;
  pitchDynamics: string;
  stressPatterns: string;
}

export interface AcousticFeatures {
  durationSec: number;
  rms: number;
  zeroCrossingRate: number;
  highFreqRatio: number;
  estimatedPitchHz: number;
  syllableRate: number;
  speechRhythmRatio: number;
}

export interface AccentAnalysisResponse {
  primaryCountry: string;
  countryFlag: string;
  regionOrDialect: string;
  confidenceScore: number;
  imitatedAccentDetected: boolean;
  imitatedAccentDetails?: string;
  transcription: string;
  verdictSummary: string;
  runnerUpCountries: RunnerUpMatch[];
  phoneticMarkers: PhoneticMarker[];
  prosodyAndRhythm: ProsodicMetrics;
  acoustics?: AcousticFeatures;
  engineTelemetry?: {
    gemini: { status: string; error?: string };
    kimi: { status: string; error?: string };
    acoustic: { status: string };
    primaryEngineUsed: string;
  };
  quotaRemaining: number;
  isAdmin: boolean;
  timestamp: string;
}

export interface QuotaStatus {
  triesRemaining: number;
  maxDailyTries: number;
  isAdmin: boolean;
  resetAt: string;
}
