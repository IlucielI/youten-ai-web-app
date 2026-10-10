'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { StatusPill } from '@/components/molecules/status-pill';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { useAuthStore } from '@/stores/auth.store';

export interface NavLinkItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavbarUser {
  name?: string;
  email?: string;
  role_name?: string;
  role_code?: string;
}

export interface NavbarProps {
  brandName?: string;
  brandHref?: string;
  brandTag?: string;
  userTier?: string;
  tierVariant?: 'default' | 'premium';
  links?: NavLinkItem[];
  currentPath?: string;
  showStatus?: boolean;
  statusLabel?: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  user?: NavbarUser | null;
  onLogout?: () => void;
}

const defaultLinks: NavLinkItem[] = [];

export const Navbar: React.FC<NavbarProps> = ({
  brandName = 'Youten AI',
  brandHref = '/',
  brandTag = 'Beta',
  userTier,
  tierVariant,
  links = defaultLinks,
  currentPath = '/',
  showStatus = false,
  statusLabel = 'Sistem Aktif',
  ctaText = 'Masuk',
  ctaHref = '/login',
  className = '',
  user: userProp,
  onLogout: onLogoutProp,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const storeUser = useAuthStore((s) => s.user);
  const storeLogout = useAuthStore((s) => s.logout);

  const activeUser: NavbarUser | null =
    userProp !== undefined
      ? userProp
      : storeUser
        ? {
            name: storeUser.full_name || storeUser.email,
            email: storeUser.email,
            role_name: storeUser.role_name,
            role_code: storeUser.role_code,
          }
        : null;

  const handleLogout = onLogoutProp !== undefined ? onLogoutProp : storeLogout;

  const effectiveUserTier =
    userTier ||
    (activeUser
      ? activeUser.role_name || (activeUser.role_code === 'PRO' ? 'Pro Member' : 'Free Member')
      : undefined);

  const effectiveTierVariant =
    tierVariant || (activeUser?.role_code === 'PRO' ? 'premium' : 'default');

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={brandHref} className="flex items-center gap-2.5 group">
          <YoutenLogo size="sm" className="group-hover:scale-105" />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-primary transition-colors">
              {brandName}
            </span>
            {effectiveUserTier ? (
              <span
                data-testid="navbar-tier-badge"
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  effectiveTierVariant === 'premium'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-primary-subtle text-primary border-primary/20'
                }`}
              >
                {effectiveUserTier}
              </span>
            ) : brandTag ? (
              <span className="text-[10px] font-bold text-primary bg-primary-subtle px-2 py-0.5 rounded-full border border-primary/20">
                {brandTag}
              </span>
            ) : null}
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = link.active ?? currentPath === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-primary bg-primary-subtle'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {showStatus && (
            <Link href="/health">
              <StatusPill label={statusLabel} status="online" />
            </Link>
          )}

          {activeUser ? (
            <div className="flex items-center gap-2.5" data-testid="navbar-user-section">
              <Link
                href="/dashboard"
                data-testid="navbar-dashboard-button"
                className="inline-flex items-center justify-center font-bold text-xs py-2 px-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm shadow-primary/20 transition-all active:scale-95"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span
                  data-testid="navbar-user-name"
                  className="text-xs font-semibold text-slate-800 hidden lg:inline max-w-[120px] truncate"
                  title={activeUser.name || activeUser.email}
                >
                  {activeUser.name || activeUser.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  data-testid="navbar-logout-button"
                  className="p-1.5 text-slate-500 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer text-xs font-semibold inline-flex items-center gap-1"
                  title="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Keluar</span>
                </button>
              </div>
            </div>
          ) : ctaText ? (
            <Link
              href={ctaHref}
              data-testid="navbar-cta-button"
              className="inline-flex items-center justify-center font-bold text-xs py-2 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm shadow-primary/20 transition-all active:scale-95"
            >
              {ctaText}
            </Link>
          ) : null}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          aria-label="Toggle mobile menu"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {showStatus && (
              <Link href="/health" onClick={() => setMobileMenuOpen(false)}>
                <StatusPill label={statusLabel} status="online" />
              </Link>
            )}
            {activeUser ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-center py-2 px-4 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold transition-colors cursor-pointer"
                >
                  Keluar
                </button>
              </>
            ) : ctaText ? (
              <Link
                href={ctaHref}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
              >
                {ctaText}
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
};
