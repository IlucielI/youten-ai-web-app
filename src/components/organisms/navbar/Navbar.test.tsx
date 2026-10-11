import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';

describe('Navbar Component', () => {
  it('renders brand name and navigation links', () => {
    render(
      <Navbar
        brandName="My Awesome App"
        links={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
        ]}
      />
    );

    expect(screen.getByText('My Awesome App')).toBeDefined();
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('About')).toBeDefined();
  });

  it('renders userTier badge with default styling', () => {
    render(<Navbar brandName="Youten AI" userTier="Free Member" />);
    const badge = screen.getByTestId('navbar-tier-badge');
    expect(badge).toHaveTextContent('Free Member');
    expect(badge.className).toContain('text-primary');
  });

  it('renders userTier badge with premium styling when tierVariant is premium', () => {
    render(<Navbar brandName="Youten AI" userTier="Pro Member" tierVariant="premium" />);
    const badge = screen.getByTestId('navbar-tier-badge');
    expect(badge).toHaveTextContent('Pro Member');
    expect(badge.className).toContain('text-amber-800');
  });

  it('renders user dropdown with user name and options when user is authenticated', async () => {
    const handleLogout = vi.fn();
    render(
      <Navbar
        brandName="Youten AI"
        user={{ name: 'Bayu', email: 'bayu@youten.ai', role_code: 'PRO', role_name: 'Pro Member' }}
        onLogout={handleLogout}
      />
    );

    expect(screen.getByTestId('navbar-user-section')).toBeInTheDocument();
    expect(screen.getByText('Bayu')).toBeInTheDocument();
    expect(screen.queryByTestId('navbar-cta-button')).not.toBeInTheDocument();

    const trigger = screen.getByTestId('user-nav-dropdown-trigger');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.click(trigger);

    expect(await screen.findByTestId('dashboard-nav-item')).toBeInTheDocument();
    expect(await screen.findByTestId('settings-nav-item')).toBeInTheDocument();
    expect(await screen.findByTestId('logout-btn')).toBeInTheDocument();
  });

  it('triggers onLogout callback when logout button is clicked from dropdown', async () => {
    const handleLogout = vi.fn();
    render(
      <Navbar
        brandName="Youten AI"
        user={{ name: 'Bayu', email: 'bayu@youten.ai' }}
        onLogout={handleLogout}
      />
    );

    const trigger = screen.getByTestId('user-nav-dropdown-trigger');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.click(trigger);

    const logoutBtn = await screen.findByTestId('logout-btn');
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('renders ctaText when user is null', () => {
    render(<Navbar brandName="Youten AI" user={null} ctaText="Masuk" ctaHref="/login" />);
    expect(screen.getByTestId('navbar-cta-button')).toHaveTextContent('Masuk');
    expect(screen.queryByTestId('navbar-user-section')).not.toBeInTheDocument();
  });
});

