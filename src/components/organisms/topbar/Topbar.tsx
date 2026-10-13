'use client';

import React from 'react';
import { Breadcrumb } from '@/components/molecules/breadcrumb';
import { StatusPill } from '@/components/molecules/status-pill';
import { UserNavDropdown } from '@/components/molecules/user-nav-dropdown';
import { LanguageSwitcher } from '@/components/molecules/language-switcher';
import { ThemeToggle } from '@/components/molecules/theme-toggle';

export interface TopbarProps {
  breadcrumbTitle?: string;
  breadcrumbRoot?: string;
  statusText?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  onLogout?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbTitle = 'System Dashboard',
  breadcrumbRoot = 'Portal',
  statusText = 'Online',
  userName = 'Developer',
  userRole = 'Admin',
  userInitials = 'DV',
  onLogout,
  actions,
  className = '',
}) => {
  return (
    <header
      className={`h-[68px] bg-background/95 backdrop-blur-md border-b border-border px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 ${className}`}
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center">
        <Breadcrumb root={breadcrumbRoot} current={breadcrumbTitle} />
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center gap-3.5">
        <StatusPill label={statusText} status="online" />

        <ThemeToggle />
        <LanguageSwitcher />

        {actions}

        <div className="pl-2 border-l border-border">
          <UserNavDropdown
            name={userName}
            email={userRole}
            initials={userInitials}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
};
