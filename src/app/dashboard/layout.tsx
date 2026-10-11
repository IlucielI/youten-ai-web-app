import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Kelola rekaman suara, ringkasan rapat, dan transkripsi Anda di Youten AI.',
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
