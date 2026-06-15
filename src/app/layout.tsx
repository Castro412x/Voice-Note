import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { UserMenu } from '@/components/UserMenu';
import { OfflineBanner } from '@/components/OfflineBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voice Note',
  description: 'Note taking app with voice support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex h-full flex-col bg-gray-900 text-gray-100 antialiased">
        <Providers>
          <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <h1 className="text-lg font-bold text-white">Voice Note</h1>
            <UserMenu />
          </header>
          <OfflineBanner />
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
