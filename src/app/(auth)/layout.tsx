import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/organisms/navbar';
import { Footer } from '@/components/organisms/footer';

export const metadata: Metadata = {
  title: 'Autentikasi',
  description: 'Masuk atau daftar ke platform Youten AI untuk transkripsi dan notula rapat otomatis.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/80 dark:bg-slate-950 text-foreground antialiased selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      {/* Ambient decorative background glows */}
      <div
        className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[720px] h-[400px] rounded-full bg-gradient-to-b from-blue-400/15 to-indigo-500/0 blur-3xl dark:from-blue-600/15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-48 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Global Application Navbar (with ID/EN language switcher, without Sign In button) */}
      <Navbar
        showCta={false}
        brandName="Youten AI"
        links={[]}
      />

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-14 z-10 w-full">
        <div className="w-full max-w-[520px]">
          {children}
        </div>
      </main>

      {/* Global Application Footer */}
      <Footer />
    </div>
  );
}
