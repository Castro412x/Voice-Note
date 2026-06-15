'use client';

import { Toaster } from 'react-hot-toast';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f3f4f6',
            },
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#f3f4f6',
            },
          },
        }}
      />
      {children}
    </>
  );
}
