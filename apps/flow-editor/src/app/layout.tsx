import type { Metadata } from 'next';
import '@xyflow/react/dist/style.css'; // React Flow CSS must be imported first
import './globals.css';

export const metadata: Metadata = {
  title: 'Flow Editor - Anticapture Notification Bot',
  description: 'Visual flow editor for the notification bot conversation flow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
