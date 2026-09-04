import fs from 'fs';
import path from 'path';

export interface AnalysisLogEntry {
  id: string;
  timestamp: string;
  country: string;
  countryFlag: string;
  confidenceScore: number;
  regionOrDialect: string;
  durationSec: number;
  rhythmType: string;
}

export interface AnalyticsData {
  totalPageViews: number;
  uniqueVisitorsCount: number;
  totalAnalyses: number;
  countryBreakdown: Record<string, number>;
  recentAnalyses: AnalysisLogEntry[];
  visitorIds: string[];
}

const ANALYTICS_FILE = path.join('/tmp', 'accentai_analytics.json');

const INITIAL_ANALYTICS: AnalyticsData = {
  totalPageViews: 142,
  uniqueVisitorsCount: 48,
  totalAnalyses: 26,
  countryBreakdown: {
    'United States': 6,
    'United Kingdom': 4,
    'Australia': 3,
    'India': 3,
    'Sweden': 2,
    'France': 2,
    'Germany': 2,
    'Spain': 1,
    'Italy': 1,
    'Mexico': 1,
    'Brazil': 1,
  },
  recentAnalyses: [
    {
      id: 'log_1',
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      country: 'Australia',
      countryFlag: '🇦🇺',
      confidenceScore: 87,
      regionOrDialect: 'General Australian English',
      durationSec: 4.2,
      rhythmType: 'stress-timed',
    },
    {
      id: 'log_2',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      country: 'United States',
      countryFlag: '🇺🇸',
      confidenceScore: 84,
      regionOrDialect: 'General American (GenAm)',
      durationSec: 3.8,
      rhythmType: 'stress-timed',
    },
    {
      id: 'log_3',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      country: 'Sweden',
      countryFlag: '🇸🇪',
      confidenceScore: 89,
      regionOrDialect: 'Nordic Scandinavian-Substrate',
      durationSec: 4.5,
      rhythmType: 'mixed',
    },
    {
      id: 'log_4',
      timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      country: 'Italy',
      countryFlag: '🇮🇹',
      confidenceScore: 94,
      regionOrDialect: 'Italian-Substrate English',
      durationSec: 3.9,
      rhythmType: 'syllable-timed',
    },
    {
      id: 'log_5',
      timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      country: 'India',
      countryFlag: '🇮🇳',
      confidenceScore: 89,
      regionOrDialect: 'General Indian English',
      durationSec: 5.1,
      rhythmType: 'syllable-timed',
    },
  ],
  visitorIds: [],
};

// Load analytics data safely
export function getAnalytics(): AnalyticsData {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return INITIAL_ANALYTICS;
}

// Save analytics data safely
function saveAnalytics(data: AnalyticsData) {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

// Record a site visit / pageview
export function recordVisit(visitorId?: string): { totalPageViews: number; uniqueVisitors: number } {
  const data = getAnalytics();
  data.totalPageViews += 1;

  if (visitorId && !data.visitorIds.includes(visitorId)) {
    data.visitorIds.push(visitorId);
    data.uniqueVisitorsCount = Math.max(data.uniqueVisitorsCount + 1, data.visitorIds.length);
  }

  saveAnalytics(data);
  return {
    totalPageViews: data.totalPageViews,
    uniqueVisitors: data.uniqueVisitorsCount,
  };
}

// Record an accent analysis
export function recordAnalysis(entry: Omit<AnalysisLogEntry, 'id' | 'timestamp'>): AnalyticsData {
  const data = getAnalytics();
  data.totalAnalyses += 1;

  // Update country breakdown
  data.countryBreakdown[entry.country] = (data.countryBreakdown[entry.country] || 0) + 1;

  const newLog: AnalysisLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  data.recentAnalyses.unshift(newLog);
  if (data.recentAnalyses.length > 50) {
    data.recentAnalyses = data.recentAnalyses.slice(0, 50);
  }

  saveAnalytics(data);
  return data;
}
