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
            'hover:border-border hover:bg-muted/80 transition-all duration-150',
            'cursor-pointer text-left outline-none select-none',
            'focus-visible:ring-2 focus-visible:ring-primary/20',
            'data-[state=open]:bg-muted data-[state=open]:border-border',
            className
          )}
          data-testid="user-nav-dropdown-trigger"
          aria-label={t('navbar.userMenu.settings')}
        >
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-2 ring-border shrink-0">
            {displayInitials}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-foreground leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground leading-tight max-w-[140px] truncate">
              {displayEmail}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={8}
        className="w-56 p-1.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
      >
        {/* Profile Card Header */}
        <div className="px-2.5 py-2">
          <p className="text-xs font-semibold text-foreground leading-tight truncate">
            {displayName}
          </p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {displayEmail}
          </p>
        </div>

        <DropdownMenuSeparator className="my-1 bg-border" />

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
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted font-medium'
              )}
              data-testid="dashboard-nav-item"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isDashboardActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  )}
                />
                <span>{t('navbar.userMenu.dashboard')}</span>
              </div>
              {isDashboardActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
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
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground hover:text-primary hover:bg-muted font-medium'
            )}
            data-testid="settings-nav-item"
          >
            <div className="flex items-center gap-2">
              <Settings
                className={cn(
                  'w-4 h-4 transition-colors',
                  isSettingsActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                )}
              />
              <span>{t('navbar.userMenu.settings')}</span>
            </div>
            {isSettingsActive && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                aria-hidden="true"
                data-testid="settings-active-indicator"
              />
            )}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-border" />

        {/* Keluar / Logout */}
        <DropdownMenuItem
          variant="destructive"
          onClick={onLogout}
          data-testid="logout-btn"
          className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive rounded-md transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-destructive" />
          <span>{t('navbar.userMenu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
