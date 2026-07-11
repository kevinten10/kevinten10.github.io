import type { Metadata } from 'next';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'KevinTen | Software Architect & AI-Native Developer',
  description: 'Software Architect focused on cloud-native distributed systems, multi-runtime architecture & AI engineering. Apache Dubbo / Dapr / Layotto contributor.',
  keywords: ['Software Architect', 'AI Engineer', 'Distributed Systems', 'Cloud Native', 'Multi-Runtime', 'MCP', 'AI Agent'],
  authors: [{ name: 'KevinTen' }],
  metadataBase: new URL('https://kevinten.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://kevinten.com',
    title: 'KevinTen | Software Architect & AI-Native Developer',
    description: 'Software Architect focused on cloud-native distributed systems, multi-runtime architecture & AI engineering.',
    images: [{ url: 'https://avatars.githubusercontent.com/u/22876610?v=4', width: 400, height: 400 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KevinTen | Software Architect & AI-Native Developer',
    description: 'Software Architect focused on cloud-native distributed systems, multi-runtime architecture & AI engineering.',
    images: ['https://avatars.githubusercontent.com/u/22876610?v=4'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="theme-color" id="theme-color-meta" content="#050508" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
