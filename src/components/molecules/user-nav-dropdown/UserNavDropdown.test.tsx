import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserNavDropdown } from './UserNavDropdown';

describe('UserNavDropdown', () => {
  it('renders user name, email, and initials in the trigger', () => {
    render(
      <UserNavDropdown
        user={{
          full_name: 'Bayu Wicaksono',
          email: 'bayu@youten.ai',
        }}
      />
    );

    expect(screen.getByText('Bayu Wicaksono')).toBeInTheDocument();
    expect(screen.getByText('bayu@youten.ai')).toBeInTheDocument();
    expect(screen.getByText('BW')).toBeInTheDocument();
  });

  it('falls back to default labels when no user is provided', () => {
    render(<UserNavDropdown />);

    expect(screen.getByText('Pengguna')).toBeInTheDocument();
    expect(screen.getByText('Akun Terverifikasi')).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();
  });

  it('renders settings and logout options when opened', () => {
    render(
      <UserNavDropdown
        open={true}
        user={{
          full_name: 'Bayu',
          email: 'bayu@youten.ai',
        }}
      />
    );

    expect(screen.getByTestId('settings-nav-item')).toBeInTheDocument();
    expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    expect(screen.getByText('Pengaturan')).toBeInTheDocument();
    expect(screen.getByText('Keluar')).toBeInTheDocument();
  });

  it('triggers onLogout callback when logout button is clicked', async () => {
    const handleLogout = vi.fn();
    render(
      <UserNavDropdown
        open={true}
        user={{ full_name: 'Bayu', email: 'bayu@youten.ai' }}
        onLogout={handleLogout}
      />
    );

    const logoutBtn = screen.getByTestId('logout-btn');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(handleLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('has valid link to /settings in the settings option', () => {
    render(
      <UserNavDropdown
        open={true}
        user={{ full_name: 'Bayu', email: 'bayu@youten.ai' }}
      />
    );

    const settingsLink = screen.getByTestId('settings-nav-item');
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('opens dropdown when trigger is clicked (uncontrolled)', async () => {
    render(
      <UserNavDropdown
        user={{ full_name: 'Bayu', email: 'bayu@youten.ai' }}
      />
    );

    const trigger = screen.getByTestId('user-nav-dropdown-trigger');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    });
  });
});
