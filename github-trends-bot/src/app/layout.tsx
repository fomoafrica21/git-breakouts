import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Git Breakouts | Dashboard',
  description: 'Review and approve breakout GitHub projects for X',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}