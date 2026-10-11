import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pengaturan Akun',
  description: 'Kelola profil akun, preferensi bahasa, dan keamanan kata sandi Anda di Youten AI.',
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
