'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Unlock,
  Lock,
  Users,
  BarChart3,
  Activity,
  Globe2,
  RefreshCw,
  Clock,
  Radio,
  ArrowLeft,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { AnalyticsData, AnalysisLogEntry } from '@/lib/analytics';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'recordings'>('overview');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (keyToUse?: string) => {
    const key = keyToUse || passcode || localStorage.getItem('accentai_admin_key') || '';

    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/analytics/stats?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAnalytics(json.data);
          setIsAdmin(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [passcode]);

  useEffect(() => {
    // Check active session & admin key
    const checkAuthAndKey = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) {
            setUserEmail(meData.user.email);
            if (meData.user.role === 'admin' || meData.user.email === 'lukedale7776@gmail.com') {
              setIsAdmin(true);
              fetchAnalytics('admin123');
              return;
            }
          }
        }
      } catch {
        // ignore
      }

      const savedKey = localStorage.getItem('accentai_admin_key');
      if (savedKey) {
        setPasscode(savedKey);
        setIsAdmin(true);
        fetchAnalytics(savedKey);
      }
    };

    checkAuthAndKey();
  }, [fetchAnalytics]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    const clean = passcode.trim();
    try {
      const res = await fetch('/api/quota?action=verify_admin', {
        headers: { 'x-admin-key': clean },
      });
      const data = await res.json();

      if (data.isAdmin) {
        localStorage.setItem('accentai_admin_key', clean);
        setIsAdmin(true);
        await fetchAnalytics(clean);
      } else {
        setError('Incorrect admin passcode. (Default: admin123, or log in with lukedale7776@gmail.com)');
      }
    } catch {
      setError('Connection error while validating admin key.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accentai_admin_key');
    setIsAdmin(false);
    setPasscode('');
    setAnalytics(null);
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'just now';
    }
  };

  const sortedCountries = analytics?.countryBreakdown
    ? Object.entries(analytics.countryBreakdown).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AccentAI App</span>
          </Link>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Owner Account:</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              lukedale7776@gmail.com
            </span>
          </div>
        </div>

        {/* Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 glow-indigo flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  AccentAI Executive Admin Console
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>LIVE TELEMETRY</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real-time site traffic, speech recordings telemetry, and global country statistics.
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => fetchAnalytics()}
                disabled={isLoadingAnalytics}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
              >
                Lock Admin
              </button>
            </div>
          )}
        </div>

        {/* Unlocked Dashboard Content */}
        {isAdmin ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Total Page Views</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {analytics ? analytics.totalPageViews.toLocaleString() : '...'}
                </div>
                <div className="text-xs text-emerald-400 font-semibold mt-2">
                  {analytics ? analytics.uniqueVisitorsCount : 0} unique visitors
                </div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Voice Analyses</span>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {analytics ? analytics.totalAnalyses.toLocaleString() : '...'}
                </div>
                <div className="text-xs text-purple-300 font-semibold mt-2">
                  Speech tests recorded
                </div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Countries Identified</span>
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {sortedCountries.length || 0}
                </div>
                <div className="text-xs text-cyan-300 font-semibold mt-2">
                  Global dialects tested
                </div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-300 text-xs mb-2">
                  <span>Quota Status</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-200">
                  Unlimited
                </div>
                <div className="text-xs text-emerald-300 font-semibold mt-2">
                  Bypassing 5-try quota
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 border-b border-white/10 pb-3">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Country Distribution ({sortedCountries.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('recordings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'recordings'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Live Audio Feed ({analytics?.recentAnalyses?.length || 0})</span>
              </button>
            </div>

            {/* Tab 1: Country Breakdown */}
            {activeTab === 'overview' && (
              <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Top Accents Detected Across Visitors
                </h3>
                {sortedCountries.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-8 text-center">
                    No accent recordings recorded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sortedCountries.map(([country, count]) => {
                      const total = analytics?.totalAnalyses || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div
                          key={country}
                          className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between"
                        >
                          <div className="space-y-1.5 flex-1 pr-4">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white text-sm">{country}</span>
                              <span className="text-slate-400 font-mono">{count} tests ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Live Recording Feed */}
            {activeTab === 'recordings' && (
              <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Live Incoming Audio Feed</span>
                  <span className="text-xs text-slate-500 lowercase font-mono">
                    auto-persisting to telemetry log
                  </span>
                </h3>

                {(!analytics?.recentAnalyses || analytics.recentAnalyses.length === 0) ? (
                  <p className="text-sm text-slate-500 italic py-8 text-center">
                    No recordings recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {analytics.recentAnalyses.map((item: AnalysisLogEntry) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <span className="text-3xl select-none shrink-0">{item.countryFlag}</span>
                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm truncate">{item.country}</span>
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-mono border border-indigo-500/20">
                                {item.confidenceScore}% Match
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {item.regionOrDialect} • {item.rhythmType}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 text-xs text-slate-500 flex flex-col items-end">
                          <span className="flex items-center space-x-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{getRelativeTime(item.timestamp)}</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-600 mt-1">
                            {item.durationSec ? `${item.durationSec.toFixed(1)}s audio` : 'audio'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Login / Passcode Gate */
          <div className="max-w-md mx-auto p-8 rounded-3xl glass-panel border border-white/10 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Owner Admin Access Required</h2>
              <p className="text-xs text-slate-400">
                Log in with <code className="text-indigo-300 font-mono">lukedale7776@gmail.com</code> or enter the secret admin passcode below.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Passcode
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter admin passcode (e.g. admin123)..."
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all pl-9"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || !passcode.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isVerifying ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Unlock Admin Console</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
