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

export interface PraatFeatures {
  duration_sec: number;
  pitch: {
    mean_hz: number;
    std_hz: number;
    min_hz: number;
    max_hz: number;
  };
  formants: {
    f1_mean: number;
    f2_mean: number;
    f3_mean: number;
  };
  voice_quality: {
    jitter_local: number | null;
    shimmer_local: number | null;
    reliable?: boolean;
  };
  intensity: {
    mean_db: number;
    std_db: number;
  };
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
  praat?: PraatFeatures;
  engineTelemetry?: {
    gemini: { status: string; error?: string };
    kimi: { status: string; error?: string };
    acoustic: { status: string };
    praat?: { status: string; error?: string };
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
