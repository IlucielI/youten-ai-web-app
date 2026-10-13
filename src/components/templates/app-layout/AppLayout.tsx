import React from 'react';
import { Navbar, NavbarProps } from '@/components/organisms/navbar';
import { Footer, FooterProps } from '@/components/organisms/footer';

export interface AppLayoutProps {
  children: React.ReactNode;
  navbarProps?: NavbarProps;
  footerProps?: FooterProps;
  showFooter?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  navbarProps,
  footerProps,
  showFooter = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar {...navbarProps} />

      <main className="flex-1 w-full">{children}</main>

      {showFooter && <Footer {...footerProps} />}
    </div>
  );
};
