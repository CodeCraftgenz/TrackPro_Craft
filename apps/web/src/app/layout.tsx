import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'TrackPro - First-Party Analytics & Server-Side Tracking',
    template: '%s | TrackPro',
  },
  description:
    'Plataforma SaaS de tracking first-party com Meta CAPI integration. Analytics em tempo real, LGPD compliant, e dashboard analítico poderoso.',
  keywords: [
    'analytics',
    'tracking',
    'first-party data',
    'Meta CAPI',
    'server-side tracking',
    'LGPD',
    'privacy',
    'marketing analytics',
  ],
  authors: [{ name: 'TrackPro' }],
  creator: 'TrackPro',
  publisher: 'TrackPro',
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
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://trackpro.io',
    siteName: 'TrackPro',
    title: 'TrackPro - First-Party Analytics & Server-Side Tracking',
    description:
      'Plataforma SaaS de tracking first-party com Meta CAPI integration. Analytics em tempo real, LGPD compliant.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TrackPro Analytics Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrackPro - First-Party Analytics',
    description: 'Plataforma SaaS de tracking first-party com Meta CAPI integration.',
    images: ['/og-image.png'],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://trackpro.io'),
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
