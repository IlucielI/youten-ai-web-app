import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YoutenLogo } from './youten-logo';

describe('YoutenLogo Component', () => {
  it('renders SVG logo mark with default dimensions', () => {
    render(<YoutenLogo />);
    const logoMark = screen.getByTestId('youten-logo-mark');
    expect(logoMark).toBeInTheDocument();
    expect(logoMark).toHaveAttribute('viewBox', '0 0 29 28');
  });

  it('renders custom sizes correctly', () => {
    const { rerender } = render(<YoutenLogo size="sm" />);
    let logoMark = screen.getByTestId('youten-logo-mark');
    expect(logoMark).toHaveAttribute('width', '22');

    rerender(<YoutenLogo size="lg" />);
    logoMark = screen.getByTestId('youten-logo-mark');
    expect(logoMark).toHaveAttribute('width', '36');

    rerender(<YoutenLogo size={40} />);
    logoMark = screen.getByTestId('youten-logo-mark');
    expect(logoMark).toHaveAttribute('width', '40');
  });

  it('renders brand text when showText is true', () => {
    render(<YoutenLogo showText />);
    expect(screen.getByTestId('youten-logo-mark')).toBeInTheDocument();
    expect(screen.getByTestId('youten-logo-text')).toHaveTextContent('Youten AI');
  });
});
