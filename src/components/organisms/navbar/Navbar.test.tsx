import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});

