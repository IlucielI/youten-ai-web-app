import React from 'react';
import { Navbar, NavbarProps } from '@/components/organisms/navbar';

export interface AppLayoutProps {
  children: React.ReactNode;
  navbarProps?: NavbarProps;
  showFooter?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  navbarProps,
  showFooter = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar {...navbarProps} />

      <main className="flex-1 w-full">{children}</main>

      {showFooter && (
        <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Youten AI</span>
              <span>• Intelligent Speech &amp; Meeting Synthesis</span>
            </div>
            <p className="text-slate-400">
              © {new Date().getFullYear()} Youten AI. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};
