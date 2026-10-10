import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from './switch';

describe('Switch Atom', () => {
  it('renders unchecked switch with visible track and thumb', () => {
    render(<Switch data-testid="test-switch" />);
    const switchEl = screen.getByTestId('test-switch');
    expect(switchEl).toBeInTheDocument();
    expect(switchEl).toHaveAttribute('data-state', 'unchecked');
    expect(switchEl.className).toContain('bg-slate-300');

    const thumb = switchEl.querySelector('[data-slot="switch-thumb"]');
    expect(thumb).toBeInTheDocument();
    expect(thumb?.className).toContain('bg-white');
    expect(thumb?.className).toContain('shadow-md');
  });

  it('renders checked switch with primary track', () => {
    render(<Switch data-testid="test-switch" checked />);
    const switchEl = screen.getByTestId('test-switch');
    expect(switchEl).toHaveAttribute('data-state', 'checked');
    expect(switchEl.className).toContain('data-[state=checked]:bg-primary');
  });

  it('toggles state on click when uncontrolled or controlled', () => {
    const handleChange = vi.fn();
    render(<Switch data-testid="test-switch" onCheckedChange={handleChange} />);
    const switchEl = screen.getByTestId('test-switch');

    fireEvent.click(switchEl);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('supports small size variant', () => {
    render(<Switch data-testid="test-switch" size="sm" />);
    const switchEl = screen.getByTestId('test-switch');
    expect(switchEl.className).toContain('h-4 w-7');

    const thumb = switchEl.querySelector('[data-slot="switch-thumb"]');
    expect(thumb?.className).toContain('h-3 w-3');
  });
});
