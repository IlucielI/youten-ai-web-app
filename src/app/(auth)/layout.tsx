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
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-foreground antialiased selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      {/* Ambient background blur elements */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Top Brand Header */}
      <header className="p-6 flex items-center justify-between max-w-7xl w-full mx-auto z-10">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90"
          data-testid="auth-brand-logo"
        >
          <YoutenLogo size="sm" className="group-hover:scale-105 transition-transform" />
          <span className="font-bold text-lg tracking-tight">Youten AI</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-testid="auth-back-home-link"
        >
          &larr; Kembali ke Beranda
        </Link>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10 w-full">
        <div className="w-full max-w-md">
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
