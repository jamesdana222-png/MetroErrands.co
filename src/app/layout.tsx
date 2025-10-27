import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MetroErrandCo - Professional Errand Services',
  description: 'Professional errand service platform for managing employees and tasks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload the video file for faster startup */}
        <link
          rel="preload"
          href="/blink.mp4"
          as="video"
          type="video/mp4"
        />
      </head>
      <body className={inter.className}>
        {/* Skip to content link for keyboard users */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black focus:border focus:border-blue-500"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <ToastProvider>
            <main id="main-content">
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}