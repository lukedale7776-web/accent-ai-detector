'use client';

import React, { useState } from 'react';
import {
  Globe2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  FileText,
  Copy,
  Check,
  Sparkles,
  BarChart3,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { AccentAnalysisResponse } from '@/lib/types';
import { CountryMotionGraphic } from './CountryMotionGraphic';

interface AnalysisResultViewProps {
  result: AccentAnalysisResponse;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://accent-ai-detector.vercel.app';
  const shareText = `🎙️ I scored ${result.confidenceScore}% ${result.primaryCountry} (${result.countryFlag}) on AccentAI! Can it recognize where your accent is from? Test your voice free: ${shareUrl}`;

  const copyReport = () => {
    const text = `AccentAI Analysis Report:
Primary Country: ${result.primaryCountry} (${result.countryFlag})
Confidence: ${result.confidenceScore}%
Dialect/Substrate: ${result.regionOrDialect}
Rhythm: ${result.prosodyAndRhythm.rhythmType}
Transcript: "${result.transcription}"
Summary: ${result.verdictSummary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleRedditShare = () => {
    const title = `I scored ${result.confidenceScore}% ${result.primaryCountry} (${result.countryFlag}) on this acoustic accent detector. What does it give your voice?`;
    const url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Primary Result Banner with 2.5D Motion Graphics */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden border border-indigo-500/30 glow-indigo">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left: Country details & Confidence */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-5xl sm:text-6xl filter drop-shadow-md select-none">
                {result.countryFlag}
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
                    Primary Country Match
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                    Verified
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-0.5">
                  {result.primaryCountry}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {result.regionOrDialect}
                </p>
              </div>
            </div>

            {/* Confidence Meter */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Match Confidence
                </span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
                  {result.confidenceScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-1000"
                  style={{ width: `${result.confidenceScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Live Procedural 2.5D Motion Graphics Animation */}
          <div className="w-full lg:w-auto flex flex-col items-center justify-center shrink-0">
            <CountryMotionGraphic
              country={result.primaryCountry}
              confidence={result.confidenceScore}
            />
          </div>
        </div>

        {/* Imitation Alert if detected */}
        {result.imitatedAccentDetected && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Imitated / Adopted Accent Elements Detected
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {result.imitatedAccentDetails ||
                  'The speaker is attempting stylistic traits of another accent, but the acoustic physics reveal an underlying native substrate.'}
              </p>
            </div>
          </div>
        )}

        {/* Verdict Summary */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Phonetic Verdict Summary</span>
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed">
            {result.verdictSummary}
          </p>
        </div>
      </div>

      {/* Viral Share & Challenge Friends Banner */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Challenge Friends: Can it guess their accent?
            </h4>
            <p className="text-[11px] text-slate-400">
              Share your {result.primaryCountry} match or post in voice communities
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={handleCopyShare}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedShare ? 'Copied Link!' : 'Copy Score'}</span>
          </button>
          <button
            onClick={handleRedditShare}
            className="px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            title="Post to Reddit (e.g. r/JudgeMyAccent)"
          >
            <span>Reddit</span>
            <ExternalLink className="w-3 h-3 text-orange-400" />
          </button>
          <button
            onClick={handleTwitterShare}
            className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            title="Post to X / Twitter"
          >
            <span>X / Twitter</span>
            <ExternalLink className="w-3 h-3 text-sky-400" />
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            title="Send on WhatsApp"
          >
            <span>WhatsApp</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Two column breakdown: Runner-up countries + Prosody */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Runner-Up Matches */}
        <div className="p-6 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Runner-Up Candidate Countries</span>
              </h3>
              <span className="text-[10px] text-slate-400">Acoustic Proximity</span>
            </div>

            <div className="space-y-3.5">
              {result.runnerUpCountries.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{item.flag}</span>
                      <span className="text-xs font-semibold text-white">{item.country}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      {item.probability}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{ width: `${item.probability}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prosodic & Rhythm Dynamics */}
        <div className="p-6 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Rhythm & Suprasegmental Prosody</span>
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {result.prosodyAndRhythm.rhythmType}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="font-semibold text-slate-200">Timing Structure</p>
                <p className="text-slate-400 mt-1">
                  {result.prosodyAndRhythm.rhythmDescription}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="font-semibold text-slate-200">Pitch Dynamics (F0)</p>
                <p className="text-slate-400 mt-1">
                  {result.prosodyAndRhythm.pitchDynamics}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="font-semibold text-slate-200">Stress & Vowel Weight</p>
                <p className="text-slate-400 mt-1">
                  {result.prosodyAndRhythm.stressPatterns}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phonetic Markers Table */}
      <div className="p-6 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Phonetic & Segmental Acoustic Markers</span>
          </h3>
          <span className="text-xs text-slate-400">IPA Phonology</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Phonetic Feature</th>
                <th className="pb-3">IPA Symbol</th>
                <th className="pb-3">Spoken Example</th>
                <th className="pb-3 pr-2">Acoustic Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.phoneticMarkers.map((marker, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pl-2 font-medium text-white">{marker.feature}</td>
                  <td className="py-3.5">
                    <code className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[11px] border border-indigo-500/20">
                      {marker.ipa}
                    </code>
                  </td>
                  <td className="py-3.5 font-semibold text-slate-300">
                    &ldquo;{marker.exampleWord}&rdquo;
                  </td>
                  <td className="py-3.5 pr-2 text-slate-400 leading-relaxed">
                    {marker.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcription */}
      <div className="p-6 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Verbatim Speech Transcription</span>
          </h3>
          <button
            onClick={copyReport}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs border border-white/10 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Full Analysis'}</span>
          </button>
        </div>

        <blockquote className="p-4 rounded-xl bg-slate-950/60 border border-white/5 text-xs sm:text-sm text-slate-300 italic leading-relaxed">
          &ldquo;{result.transcription}&rdquo;
        </blockquote>
      </div>
    </div>
  );
};
