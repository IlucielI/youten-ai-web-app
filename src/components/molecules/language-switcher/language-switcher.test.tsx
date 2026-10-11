import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from './language-switcher';
import { useLocaleStore } from '@/stores/locale.store';

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'id' });
  });

  it('renders pill variant and switches language on button click', () => {
    render(<LanguageSwitcher />);

    const idBtn = screen.getByTestId('lang-btn-id');
    const enBtn = screen.getByTestId('lang-btn-en');

    expect(idBtn).toBeInTheDocument();
    expect(enBtn).toBeInTheDocument();
    expect(idBtn).toHaveAttribute('aria-pressed', 'true');
    expect(enBtn).toHaveAttribute('aria-pressed', 'false');

    // Click EN button
    fireEvent.click(enBtn);

    expect(useLocaleStore.getState().locale).toBe('en');
    expect(enBtn).toHaveAttribute('aria-pressed', 'true');
    expect(idBtn).toHaveAttribute('aria-pressed', 'false');

    // Click ID button
    fireEvent.click(idBtn);
    expect(useLocaleStore.getState().locale).toBe('id');
    expect(idBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders compact variant and toggles language on click', () => {
    render(<LanguageSwitcher variant="compact" />);

    const compactBtn = screen.getByTestId('language-switcher-compact');
    expect(compactBtn).toBeInTheDocument();
    expect(compactBtn).toHaveTextContent('id');

    fireEvent.click(compactBtn);
    expect(useLocaleStore.getState().locale).toBe('en');
    expect(compactBtn).toHaveTextContent('en');

    fireEvent.click(compactBtn);
    expect(useLocaleStore.getState().locale).toBe('id');
    expect(compactBtn).toHaveTextContent('id');
  });
});
