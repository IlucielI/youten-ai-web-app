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

  it('renders quick navigation links when showLinks is true', () => {
    render(<Footer showLinks={true} />);

    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Status Sistem/i })).toBeInTheDocument();
  });

  it('hides quick navigation links when showLinks is false', () => {
    render(<Footer showLinks={false} />);

    expect(screen.queryByRole('link', { name: /Dashboard/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Status Sistem/i })).not.toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    render(<Footer className="custom-test-class" />);

    const footer = screen.getByTestId('app-footer');
    expect(footer.className).toContain('custom-test-class');
  });
});
