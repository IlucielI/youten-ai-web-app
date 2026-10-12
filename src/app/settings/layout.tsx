import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your profile, language preferences, and account security in Youten AI.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
