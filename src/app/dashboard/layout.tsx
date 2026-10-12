import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your voice recordings, meeting summaries, and transcripts in Youten AI.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
