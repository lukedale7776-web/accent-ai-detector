import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://accent-ai-detector.vercel.app'),
  title: {
    default: 'AccentAI — Acoustic & Speech Dialect Analyzer',
    template: '%s | AccentAI',
  },
  description:
    'Free AI-powered speech accent recognition and dialectology analyzer. Determines spoken country accent using acoustic formants, Voice Onset Time (VOT), rhythm, and phonetic markers.',
  keywords: [
    'accent detector',
    'speech accent analyzer',
    'accent recognition AI',
    'voice dialect classifier',
    'acoustic phonetics analyzer',
    'voice onset time detector',
    'retroflex consonant analysis',
    'Indian English accent',
    'British English accent',
    'Australian English accent',
    'imitation accent detector',
    'speech dialectology',
  ],
  authors: [{ name: 'AccentAI Research Team', url: 'https://accent-ai-detector.vercel.app' }],
  creator: 'AccentAI',
  publisher: 'AccentAI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://accent-ai-detector.vercel.app',
  },
  openGraph: {
    title: 'AccentAI — Discover What Country Your Spoken Accent Sounds Like',
    description:
      'Analyze audio recordings using acoustic formants, Voice Onset Time, and phonetic markers to identify country accents and detect imitation.',
    url: 'https://accent-ai-detector.vercel.app',
    siteName: 'AccentAI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AccentAI — Acoustic Speech Accent & Dialect Analyzer',
    description:
      'Analyze speech phonetics, vowel formants, and syllable timing to determine spoken English accents from audio only.',
    creator: '@accentai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
