import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer Component', () => {
  it('renders brand identity and copyright', () => {
    render(<Footer />);

    expect(screen.getByTestId('app-footer')).toBeInTheDocument();
    expect(screen.getByTestId('footer-brand-link')).toBeInTheDocument();
    expect(screen.getByText('Youten AI')).toBeInTheDocument();
    expect(screen.getByText(/Intelligent Speech & Meeting Synthesis/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${new Date().getFullYear()} Youten AI`, 'i'))).toBeInTheDocument();
  });

  it('does not render quick navigation links', () => {
    render(<Footer />);

    expect(screen.queryByRole('link', { name: /Dashboard/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Status Sistem/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /System Status/i })).not.toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    render(<Footer className="custom-test-class" />);

    const footer = screen.getByTestId('app-footer');
    expect(footer.className).toContain('custom-test-class');
  });
});
