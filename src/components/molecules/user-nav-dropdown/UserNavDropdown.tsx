'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { Settings, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useTranslation } from '@/locales';

export interface UserNavDropdownProps {
  user?: {
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
  name?: string;
  email?: string;
  initials?: string;
  onLogout?: () => void | Promise<void>;
  className?: string;
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showDashboard?: boolean;
  pathname?: string;
}

export const UserNavDropdown: React.FC<UserNavDropdownProps> = ({
  user,
  name,
  email,
  initials,
  onLogout,
  className,
  align = 'end',
  open,
  onOpenChange,
  showDashboard = true,
  pathname: pathnameProp,
}) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isMenuOpen = isControlled ? open : internalOpen;

  // Resolve active pathname using Next.js App Router usePathname hook
  const routerPathname = usePathname();
  const currentPath = pathnameProp ?? routerPathname ?? '';

  const isDashboardActive = currentPath === '/dashboard' || currentPath.startsWith('/dashboard/');
  const isSettingsActive = currentPath === '/settings' || currentPath.startsWith('/settings/');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const displayName = name || user?.full_name || t('navbar.userMenu.userFallback');
  const displayEmail = email || user?.email || t('navbar.userMenu.verifiedAccount');
  const displayInitials =
    initials ||
    (displayName
      ? displayName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'U');

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'group flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-transparent',
            'hover:border-slate-200 hover:bg-slate-50/80 transition-all duration-150',
            'cursor-pointer text-left outline-none select-none',
            'focus-visible:ring-2 focus-visible:ring-blue-500/20',
            'data-[state=open]:bg-slate-100 data-[state=open]:border-slate-200',
            className
          )}
          data-testid="user-nav-dropdown-trigger"
          aria-label={t('navbar.userMenu.settings')}
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-200 shrink-0">
            {displayInitials}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] font-medium text-slate-500 leading-tight max-w-[140px] truncate">
              {displayEmail}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={8}
        className="w-56 p-1.5 rounded-xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 text-slate-800"
      >
        {/* Profile Card Header */}
        <div className="px-2.5 py-2">
          <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
            {displayName}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {displayEmail}
          </p>
        </div>

        <DropdownMenuSeparator className="my-1 bg-slate-100" />

        {/* Dashboard */}
        {showDashboard && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/dashboard"
              aria-current={isDashboardActive ? 'page' : undefined}
              data-active={isDashboardActive}
              className={cn(
                'flex items-center justify-between w-full px-2.5 py-2 text-xs rounded-md transition-colors',
                isDashboardActive
                  ? 'bg-blue-50/90 text-blue-600 font-semibold'
                  : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 font-medium'
              )}
              data-testid="dashboard-nav-item"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isDashboardActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                  )}
                />
                <span>{t('navbar.userMenu.dashboard')}</span>
              </div>
              {isDashboardActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"
                  aria-hidden="true"
                  data-testid="dashboard-active-indicator"
                />
              )}
            </Link>
          </DropdownMenuItem>
        )}

        {/* Pengaturan / Settings */}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/settings"
            aria-current={isSettingsActive ? 'page' : undefined}
            data-active={isSettingsActive}
            className={cn(
              'flex items-center justify-between w-full px-2.5 py-2 text-xs rounded-md transition-colors',
              isSettingsActive
                ? 'bg-blue-50/90 text-blue-600 font-semibold'
                : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 font-medium'
            )}
            data-testid="settings-nav-item"
          >
            <div className="flex items-center gap-2">
              <Settings
                className={cn(
                  'w-4 h-4 transition-colors',
                  isSettingsActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                )}
              />
              <span>{t('navbar.userMenu.settings')}</span>
            </div>
            {isSettingsActive && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"
                aria-hidden="true"
                data-testid="settings-active-indicator"
              />
            )}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-slate-100" />

        {/* Keluar / Logout */}
        <DropdownMenuItem
          variant="destructive"
          onClick={onLogout}
          data-testid="logout-btn"
          className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700 rounded-md transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>{t('navbar.userMenu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
