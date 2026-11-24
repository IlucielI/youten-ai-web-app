import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://youten.bayuanugerah.my.id';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Youten AI — Enterprise AI Speech Transcription & Meeting Intelligence',
    template: '%s | Youten AI',
  },
  description:
    'Enterprise-grade AI conversation transcription with multi-speaker diarization, intelligent meeting synthesis, automated action items, and semantic search.',
  keywords: [
    'ai transcription',
    'ai meeting assistant',
    'speech to text',
    'meeting summarizer',
    'speaker diarization',
    'automated meeting notes',
    'voice to text converter',
    'audio transcription',
    'meeting minutes generator',
    'whisper ai',
    'youten ai',
    'otter ai alternative',
  ],
  authors: [{ name: 'Youten AI Team', url: appUrl }],
  creator: 'Youten AI',
  publisher: 'Youten AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['id_ID'],
    url: appUrl,
    siteName: 'Youten AI',
    title: 'Youten AI — Enterprise AI Speech Transcription & Meeting Intelligence',
    description:
      'Transform meetings and audio recordings into accurate speaker-labeled transcripts, strategic executive summaries, and searchable team knowledge.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Youten AI — Enterprise AI Speech Transcription & Meeting Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Youten AI — Enterprise AI Speech Transcription & Meeting Intelligence',
    description:
      'Transform meetings and audio recordings into accurate speaker-labeled transcripts, strategic executive summaries, and searchable team knowledge.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'id-ID': '/?lang=id',
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
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
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${appUrl}/#organization`,
      name: 'Youten AI',
      url: appUrl,
      logo: `${appUrl}/icon.svg`,
      description: 'Enterprise-grade AI conversation transcription and intelligence platform.',
    },
    {
      '@type': 'WebSite',
      '@id': `${appUrl}/#website`,
      url: appUrl,
      name: 'Youten AI',
      description: 'Enterprise AI Speech Transcription & Intelligent Meeting Synthesis Platform',
      publisher: {
        '@id': `${appUrl}/#organization`,
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${appUrl}/#application`,
      name: 'Youten AI',
      operatingSystem: 'All',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Intelligent transcription, multi-speaker diarization, strategic decision highlights, and AI-powered Q&A for meetings, interviews, and voice memos.',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
