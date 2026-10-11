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
    default: 'Youten AI — Platform Transkripsi Percakapan & Notula Rapat AI',
    template: '%s | Youten AI',
  },
  description:
    'Platform transkripsi percakapan enterprise bertenaga AI dengan diarization multi-pembicara, sintesis notula rapat cerdas, dan pencarian semantik.',
  keywords: [
    'transkripsi ai',
    'notula rapat otomatis',
    'speech to text indonesia',
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
    locale: 'id_ID',
    alternateLocale: ['en_US'],
    url: appUrl,
    siteName: 'Youten AI',
    title: 'Youten AI — Platform Transkripsi Percakapan & Notula Rapat AI',
    description:
      'Transkripsi cerdas, intisari keputusan, dan tanya jawab bertenaga AI untuk rapat, wawancara, kuliah, dan catatan suara Anda.',
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
    title: 'Youten AI — Platform Transkripsi Percakapan & Notula Rapat AI',
    description:
      'Transkripsi cerdas, intisari keputusan, dan tanya jawab bertenaga AI untuk rapat dan catatan suara.',
    images: ['/icon.svg'],
  },
  alternates: {
    canonical: '/',
    languages: {
      'id-ID': '/?lang=id',
      'en-US': '/?lang=en',
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
      description: 'Platform transkripsi percakapan enterprise bertenaga AI.',
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
        'Transkripsi cerdas, intisari keputusan, dan tanya jawab bertenaga AI untuk rapat, wawancara, dan catatan suara.',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
