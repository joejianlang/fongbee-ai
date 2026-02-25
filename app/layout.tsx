import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '优服佳 - 本地服务与 AI 新闻集成平台',
  description: '连接全球信息流与本地服务生态',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0d9488" />
      </head>
      <body className="bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
