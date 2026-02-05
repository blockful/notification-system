import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notification User Metrics Dashboard',
  description: 'Real-time insights and analytics for notification system user metrics, DAO subscriptions, and engagement tracking.',
  keywords: ['notifications', 'metrics', 'dashboard', 'analytics', 'DAO', 'subscriptions'],
  authors: [{ name: 'Blockful' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Notification User Metrics Dashboard',
    description: 'Real-time insights and analytics for notification system user metrics, DAO subscriptions, and engagement tracking.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Notification User Metrics Dashboard',
    description: 'Real-time insights and analytics for notification system user metrics, DAO subscriptions, and engagement tracking.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text">
        {children}
      </body>
    </html>
  );
}
