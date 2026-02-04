import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription Metrics Dashboard',
  description: 'Internal dashboard for subscription-server metrics.',
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
