import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Speaker Directory',
  description: 'Manage speaker profiles and voice intelligence directory in Youten AI.',
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
