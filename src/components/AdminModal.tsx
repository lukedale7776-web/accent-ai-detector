'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
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
  CheckCircle2,
  Share2
} from 'lucide-react';
import { AnalyticsData, AnalysisLogEntry } from '@/lib/analytics';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  adminPasscode?: string;
  onUnlockSuccess: (passcode: string) => void;
  onLogout: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  adminPasscode = '',
  onUnlockSuccess,
  onLogout,
}) => {
  const [passcode, setPasscode] = useState(adminPasscode);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'recordings'>('overview');

  const fetchAnalytics = useCallback(async (keyToUse?: string) => {
    const key = keyToUse || passcode || adminPasscode || localStorage.getItem('accentai_admin_key') || '';
    if (!key) return;

    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/analytics/stats?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAnalytics(json.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [passcode, adminPasscode]);

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchAnalytics();
    }
  }, [isOpen, isAdmin, fetchAnalytics]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    const cleanPass = passcode.trim();
    try {
      const res = await fetch('/api/quota?action=verify_admin', {
        headers: {
          'x-admin-key': cleanPass,
        },
      });
      const data = await res.json();

      if (data.isAdmin) {
        onUnlockSuccess(cleanPass);
        await fetchAnalytics(cleanPass);
      } else {
        setError('Incorrect admin passcode. Please check and try again.');
      }
    } catch {
      setError('Connection error while validating admin key.');
    } finally {
      setIsVerifying(false);
    }
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

  // Sort country breakdown
  const sortedCountries = analytics?.countryBreakdown
    ? Object.entries(analytics.countryBreakdown).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full ${isAdmin ? 'max-w-3xl' : 'max-w-md'} rounded-2xl glass-panel p-5 sm:p-7 border border-white/10 shadow-2xl relative max-h-[92vh] flex flex-col`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {isAdmin ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">
                {isAdmin ? 'AccentAI Executive Admin Console' : 'Unlock Admin Access'}
              </h3>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isAdmin
                ? 'Real-time site traffic, speech recordings feed, and global country statistics'
                : 'Enter your admin passcode for unlimited usage & full site analytics'}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Total Page Views</span>
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-xl font-bold text-white">
                  {analytics ? analytics.totalPageViews.toLocaleString() : '...'}
                </span>
                <span className="text-[10px] text-emerald-400 mt-1 font-medium flex items-center space-x-1">
                  <span>{analytics ? analytics.uniqueVisitorsCount : 0} unique visitors</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Voice Analyses</span>
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-xl font-bold text-white">
                  {analytics ? analytics.totalAnalyses.toLocaleString() : '...'}
                </span>
                <span className="text-[10px] text-purple-300 mt-1 font-medium">
                  Speech tests recorded
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Countries Identified</span>
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-xl font-bold text-white">
                  {sortedCountries.length || 0}
                </span>
                <span className="text-[10px] text-cyan-300 mt-1 font-medium">
                  Global dialects tested
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
                <div className="flex items-center justify-between text-emerald-300 text-xs mb-1">
                  <span>Quota Status</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xl font-bold text-emerald-200">Unlimited</span>
                <span className="text-[10px] text-emerald-300 mt-1 font-medium">
                  Bypassing 5-try quota
                </span>
              </div>
            </div>

            {/* Navigation tabs inside Admin modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'overview'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Country Distribution</span>
                </button>
                <button
                  onClick={() => setActiveTab('recordings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'recordings'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Live Recording Feed ({analytics?.recentAnalyses?.length || 0})</span>
                </button>
              </div>

              <button
                onClick={() => fetchAnalytics()}
                disabled={isLoadingAnalytics}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs flex items-center space-x-1 disabled:opacity-50"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Tab 1: Country Breakdown */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Top Accents Detected Across Visitors
                </h4>
                {sortedCountries.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No accent recordings analyzed yet. Record or upload an audio to see live stats.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {sortedCountries.map(([country, count]) => {
                      const total = analytics?.totalAnalyses || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div
                          key={country}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between"
                        >
                          <div className="space-y-1 flex-1 pr-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white">{country}</span>
                              <span className="text-slate-400 font-mono">{count} tests ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
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

            {/* Tab 2: Live Recordings Feed */}
            {activeTab === 'recordings' && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Recent Audio Analyses Feed</span>
                  <span className="text-[10px] text-slate-500 lowercase">Acoustic telemetry feed</span>
                </h4>

                {(!analytics?.recentAnalyses || analytics.recentAnalyses.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No recordings in feed yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {analytics.recentAnalyses.map((item: AnalysisLogEntry) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-2xl select-none shrink-0">{item.countryFlag}</span>
                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white truncate">{item.country}</span>
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-mono border border-indigo-500/20">
                                {item.confidenceScore}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.regionOrDialect} • {item.rhythmType}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 text-[11px] text-slate-500 flex flex-col items-end">
                          <span className="flex items-center space-x-1 text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{getRelativeTime(item.timestamp)}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-600 mt-0.5">
                            {item.durationSec ? `${item.durationSec.toFixed(1)}s` : 'audio'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Logged in as Administrator (Passcode Verified)
              </span>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
              >
                Lock Admin Mode
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="text-[11px] text-slate-500 mt-1.5">
                Enter your admin key to view site traffic analytics, live recording logs, and unlock unlimited voice tests.
              </p>
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
                <span>Verifying Passcode...</span>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Access Admin Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
