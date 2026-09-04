'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  UploadCloud,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Volume2,
  AlertCircle,
  ChevronDown,
  HelpCircle,
  Layers,
  Globe2,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AudioRecorder } from '@/components/AudioRecorder';
import { AudioUploader } from '@/components/AudioUploader';
import { AnalysisResultView } from '@/components/AnalysisResultView';
import { AdminModal } from '@/components/AdminModal';
import { AuthModal } from '@/components/AuthModal';
import { AccentAnalysisResponse, QuotaStatus } from '@/lib/types';
import { User } from '@/lib/auth';

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://accent-ai-detector.vercel.app/#webapp',
      name: 'AccentAI — Acoustic & Speech Dialect Analyzer',
      url: 'https://accent-ai-detector.vercel.app',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires modern web browser with Web Audio API',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free Tier with 5 complimentary speech accent analyses daily.',
      },
      featureList: [
        'Live microphone recording with soundwave visualizer',
        'Audio file upload (.mp3, .wav, .m4a, .webm)',
        'Formant frequency tracking (F1, F2, F3) for retroflex consonants',
        'Voice Onset Time (VOT) plosive de-aspiration measurement',
        'Imitated accent vs native substrate detection',
        'Syllable-timed vs stress-timed speech rhythm (nPVI)',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://accent-ai-detector.vercel.app/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does AccentAI determine a country accent from audio only?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AccentAI analyzes acoustic physics from the sound waveform: third formant (F3) transitions for retroflex consonants, Voice Onset Time (VOT) in milliseconds, steady-state vowel formants versus diphthongs, and normalized Pairwise Variability Index (nPVI) for syllable timing.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the 5 free daily tries quota work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Every guest visitor and registered account user gets 5 free accent analyses every day. The quota resets automatically every 24 hours at 00:00 UTC.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can AccentAI detect when someone is imitating or faking an accent?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. While speakers can adopt surface slang words (like using Australian or British slang), their involuntary native phonetic substrate (such as retroflex stops or monophthongs) still leaks through in the spectral audio signal.',
          },
        },
      ],
    },
  ],
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState<string>('audio_sample.webm');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AccentAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth & Admin state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signup');
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    // Check auth session
    fetchCurrentUser();

    // Check saved admin passcode in localStorage
    const savedPass = localStorage.getItem('accentai_admin_key');
    if (savedPass) {
      setAdminPasscode(savedPass);
      setIsAdmin(true);
    }

    // Record visitor pageview in analytics
    try {
      let visitorId = localStorage.getItem('accentai_visitor_id');
      if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem('accentai_visitor_id', visitorId);
      }
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          if (data.user.role === 'admin') setIsAdmin(true);
        }
        if (data.quota) {
          setQuota(data.quota);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleAdminUnlock = (key: string) => {
    localStorage.setItem('accentai_admin_key', key);
    setAdminPasscode(key);
    setIsAdmin(true);
    fetchCurrentUser();
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('accentai_admin_key');
    setAdminPasscode('');
    setIsAdmin(false);
    fetchCurrentUser();
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') setIsAdmin(true);
    fetchCurrentUser();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      fetchCurrentUser();
    } catch {
      // ignore
    }
  };

  const [audioDuration, setAudioDuration] = useState<number | undefined>();
  const [clientAcoustics, setClientAcoustics] = useState<{ zeroCrossingRate?: number; speechRhythmRatio?: number } | undefined>();

  const handleAudioReady = (
    blob: Blob,
    name: string,
    transcript?: string,
    duration?: number,
    acoustics?: { zeroCrossingRate?: number; speechRhythmRatio?: number }
  ) => {
    setAudioBlob(blob);
    setFileName(name);
    if (transcript !== undefined) setLiveTranscript(transcript);
    if (duration !== undefined) setAudioDuration(duration);
    if (acoustics) setClientAcoustics(acoustics);
    setError(null);
  };

  const runAnalysis = async () => {
    if (!audioBlob) {
      setError('Please record or upload an audio file first.');
      return;
    }

    if (!isAdmin && quota && quota.triesRemaining <= 0) {
      setError('You have used all 5 free tries for today. Come back tomorrow at 00:00 UTC or unlock Admin mode for unlimited access.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, fileName);
      if (liveTranscript) {
        formData.append('transcript', liveTranscript);
      }
      if (audioDuration) {
        formData.append('duration', audioDuration.toString());
      }
      if (clientAcoustics?.zeroCrossingRate) {
        formData.append('zeroCrossingRate', clientAcoustics.zeroCrossingRate.toString());
      }
      if (clientAcoustics?.speechRhythmRatio) {
        formData.append('speechRhythmRatio', clientAcoustics.speechRhythmRatio.toString());
      }

      const headers: Record<string, string> = {};
      if (isAdmin && adminPasscode) {
        headers['x-admin-key'] = adminPasscode;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze audio.');
      }

      setAnalysisResult(data);

      if (!isAdmin && quota) {
        setQuota({
          ...quota,
          triesRemaining: Math.max(0, data.quotaRemaining),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please check network connection.';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const faqItems = [
    {
      q: 'How does AccentAI determine country accents using audio only?',
      a: 'AccentAI examines vocal acoustic physics rather than text alone. It computes third-formant (F3) frequency transitions for retroflex consonants ([ʈ, ɖ]), plosive Voice Onset Time (VOT) in milliseconds, steady-state vowel formants versus diphthongs, and normalized Pairwise Variability Index (nPVI) for rhythmic cadence.',
    },
    {
      q: 'How does the 5 free daily tries quota work?',
      a: 'Every visitor and registered account holder receives 5 free analyses every 24 hours. The quota resets automatically at 00:00 UTC each day. If you need unlimited analyses, you can unlock Admin mode.',
    },
    {
      q: 'Can AccentAI detect if someone is imitating another accent?',
      a: 'Yes. When speakers mimic an accent (such as using Australian or British colloquialisms like "mate"), their deeper involuntary native phonology (e.g. dental stops, retroflexion, or monophthongs) still leaks into the spectral signal. AccentAI flags both the attempted style and the underlying native substrate.',
    },
    {
      q: 'Is my voice recording stored or uploaded publicly?',
      a: 'No. All recordings are processed securely and transiently for acoustic feature extraction. Audio is never stored publicly or shared with third parties.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* JSON-LD Schema for Google Search Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdData).replace(/</g, '\\u003c'),
        }}
      />

      <Navbar
        quota={quota}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'signup');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hero Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Acoustic Formants • Retroflexion • Voice Onset Time</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Discover What Country Your Accent Sounds Like
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            AI-powered speech accent recognition and dialectology analyzer. Evaluates vowel formants, rhythm timing ($nPVI$), and consonant phonetics to identify country origins and detect imitated accents.
          </p>
        </div>

        {/* Quota Progress Banner */}
        {!isAdmin && quota && (
          <div className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-300">
                Daily Free Tier:{' '}
                <strong className="text-white font-semibold">
                  {quota.triesRemaining} of {quota.maxDailyTries}
                </strong>{' '}
                tries remaining today (Resets daily at 00:00 UTC).
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="w-full sm:w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${(quota.triesRemaining / quota.maxDailyTries) * 100}%` }}
                />
              </div>

              {!currentUser ? (
                <button
                  onClick={() => {
                    setAuthInitialMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 shrink-0 text-xs"
                >
                  Sign Up Free
                </button>
              ) : (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 shrink-0 text-xs"
                >
                  Admin Unlock
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input Mode Selector */}
        <div className="flex items-center justify-center">
          <div className="flex items-center p-1.5 rounded-2xl bg-slate-900/80 border border-white/10">
            <button
              onClick={() => {
                setActiveTab('record');
                setError(null);
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'record'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Record Live Audio</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('upload');
                setError(null);
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Audio File</span>
            </button>
          </div>
        </div>

        {/* Audio Input Box */}
        <div className="max-w-2xl mx-auto w-full">
          {activeTab === 'record' ? (
            <AudioRecorder onAudioReady={handleAudioReady} disabled={isAnalyzing} />
          ) : (
            <AudioUploader onAudioReady={handleAudioReady} disabled={isAnalyzing} />
          )}

          {/* Action Button */}
          {audioBlob && (
            <div className="mt-6 flex flex-col items-center">
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing || (!isAdmin && quota?.triesRemaining === 0)}
                className="flex items-center space-x-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Phonetic Acoustic Signals...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Analyze Accent & Phonetics Now</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>

              {!isAdmin && quota && quota.triesRemaining <= 0 && (
                <p className="text-xs text-amber-400 mt-2 text-center">
                  Daily limit reached. Unlock Admin mode to continue.
                </p>
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4 flex items-center space-x-2.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Analysis Results View */}
        {analysisResult && (
          <div id="results" className="pt-4">
            <AnalysisResultView result={analysisResult} />
          </div>
        )}

        {/* SEO Educational Section 1: How It Works */}
        <section id="how-it-works" className="pt-10 border-t border-white/10 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              How Acoustic Accent Recognition Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              AccentAI processes speech strictly through acoustics and dialectology without relying on visual bias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl glass-panel border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-sm font-bold text-white">Audio Waveform Capture</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live microphone or uploaded audio is converted to clean 16kHz uncompressed PCM audio. FFT windowing decomposes the signal into frequency components.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-sm font-bold text-white">Formants & VOT Extraction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Computes third-formant (F3) retroflex downward drops, Voice Onset Time (VOT) in milliseconds, and Pairwise Variability Index (nPVI) for syllable timing.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-sm font-bold text-white">Dialectological Matching</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Feature vectors are benchmarked against global linguistic atlases (Speech Accent Archive, IDEA) to compute country probabilities and detect imitation.
              </p>
            </div>
          </div>
        </section>

        {/* SEO Educational Section 2: Phonetics Guide */}
        <section id="phonetics-guide" className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Acoustic Phonetics Guide: Key Diagnostic Markers</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              The physical acoustic parameters that differentiate global English dialects.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <p className="font-bold text-indigo-300">Retroflex Stops ($[ʈ, ɖ]$)</p>
              <p className="text-slate-400 leading-relaxed">
                Tongue tip curls toward the hard palate, inducing a sharp downward drop in F3 resonance toward F2. Characteristic of South Asian English.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <p className="font-bold text-cyan-300">Short-Lag VOT (&lt;20 ms)</p>
              <p className="text-slate-400 leading-relaxed">
                Voiceless plosives ($/p, t, k/$) lack long-lag aspiration. In native US/UK English, VOT exceeds 40–80 ms with an audible breath burst.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <p className="font-bold text-purple-300">Monophthongs ($[eː, oː]$)</p>
              <p className="text-slate-400 leading-relaxed">
                Vowels in words like *stay* and *paper* maintain horizontal formant tracks without the sliding diphthong transitions of British and Australian English.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <p className="font-bold text-emerald-300">Approximant ($[ʋ]$)</p>
              <p className="text-slate-400 leading-relaxed">
                Replaces separate $/v/$ and $/w/$ with a smooth labiodental glide without high-frequency turbulent friction or lip protrusion dips.
              </p>
            </div>
          </div>
        </section>

        {/* SEO Section 3: FAQ Accordion */}
        <section id="faq" className="space-y-4 pt-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center space-x-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>Frequently Asked Questions</span>
            </h2>
            <p className="text-xs text-slate-400">
              Everything you need to know about the AccentAI platform.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3 pt-4">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl glass-panel border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-white hover:text-indigo-300 transition-all"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? 'transform rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>

                {openFaq === idx && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AccentAI. Designed for acoustic dialectology and speech phonetic research.</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#phonetics-guide" className="hover:text-white transition-colors">Phonetics Guide</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
        </div>
      </footer>

      {/* Admin Unlock Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdmin={isAdmin}
        adminPasscode={adminPasscode}
        onUnlockSuccess={handleAdminUnlock}
        onLogout={handleAdminLogout}
      />

      {/* Auth Modal (Sign In / Sign Up with Welcome Email) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authInitialMode}
      />
    </div>
  );
}
