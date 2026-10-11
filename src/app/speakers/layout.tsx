import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Pembicara',
  description: 'Kelola direktori profil pembicara dan pengenalan suara Anda di Youten AI.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SpeakersPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
