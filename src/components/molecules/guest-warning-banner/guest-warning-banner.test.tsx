import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuestWarningBanner } from './guest-warning-banner';

vi.mock('@/locales', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'recording.guestBanner.title': 'Sesi Tamu Terdeteksi.',
        'recording.guestBanner.description': 'Klaim rekaman ini ke akun Anda.',
        'recording.guestBanner.claimButton': 'Klaim ke Akun',
        'recording.guestBanner.claimingButton': 'Mengklaim...',
      };
      return translations[key] || key;
    },
  }),
}));

describe('GuestWarningBanner', () => {
  it('renders banner with login link when user is not logged in', () => {
    render(<GuestWarningBanner recordingId="rec-123" isLoggedIn={false} />);

    expect(screen.getByTestId('guest-warning-banner')).toBeInTheDocument();
    const btn = screen.getByTestId('claim-account-btn');
    expect(btn.closest('a')).toHaveAttribute('href', '/login?claim=rec-123');
  });

  it('renders banner with action button when user is logged in', () => {
    const onClaim = vi.fn();
    render(
      <GuestWarningBanner
        recordingId="rec-123"
        isLoggedIn={true}
        isClaiming={false}
        onClaim={onClaim}
      />
    );

    const btn = screen.getByTestId('claim-account-btn');
    expect(btn.closest('a')).toBeNull();
    fireEvent.click(btn);
    expect(onClaim).toHaveBeenCalledTimes(1);
  });

  it('disables button when isClaiming is true', () => {
    render(
      <GuestWarningBanner
        recordingId="rec-123"
        isLoggedIn={true}
        isClaiming={true}
      />
    );

    const btn = screen.getByTestId('claim-account-btn');
    expect(btn).toBeDisabled();
    expect(screen.getByText('Mengklaim...')).toBeInTheDocument();
  });
});

