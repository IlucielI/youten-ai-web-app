import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://youten.ai';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Youten AI — AI Speech Transcription & Intelligent Meeting Synthesis Platform',
    template: '%s | Youten AI',
  },
  description:
    'Enterprise-grade AI conversation transcription with multi-speaker diarization, intelligent meeting synthesis, and semantic search.',
  keywords: [
    'ai transcription',
    'automated meeting notes',
    'speech to text',
    'meeting summarizer',
    'diarization',
    'youten ai',
    'audio transcription',
    'ai voice intelligence',
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
    title: 'Youten AI — AI Speech Transcription & Intelligent Meeting Synthesis Platform',
    description:
      'Intelligent transcription, strategic decision highlights, and AI-powered Q&A for meetings, interviews, lectures, and voice memos.',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'Youten AI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Youten AI — AI Speech Transcription & Intelligent Meeting Synthesis Platform',
    description:
      'Intelligent transcription, strategic decision highlights, and AI-powered Q&A for meetings and voice memos.',
    images: ['/icon.svg'],
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/?lang=en',
      'id-ID': '/?lang=id',
    },
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
        'Intelligent transcription, strategic decision highlights, and AI-powered Q&A for meetings, interviews, and voice memos.',
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
