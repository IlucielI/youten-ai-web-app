import React from 'react';
import Link from 'next/link';
import { YoutenLogo } from '@/components/atoms/youten-logo';

export const metadata = {
  title: 'Autentikasi — Youten AI',
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

      {/* Top Brand Header */}
      <header className="p-6 sm:px-10 flex items-center justify-between max-w-7xl w-full mx-auto z-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
          data-testid="auth-brand-logo"
        >
          <YoutenLogo size="md" className="group-hover:scale-105 transition-transform" />
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Youten AI</span>
        </Link>
        <Link
          href="/"
          className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          data-testid="auth-back-home-link"
        >
          &larr; Kembali ke Beranda
        </Link>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-14 z-10 w-full">
        <div className="w-full max-w-[520px]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted-foreground z-10 border-t border-border/40">
        <p>&copy; {new Date().getFullYear()} Youten AI. Hak cipta dilindungi undang-undang.</p>
      </footer>
    </div>
  );
}
