import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CitationBadge } from './CitationBadge';
import { usePlayerStore } from '@/stores/player.store';

describe('CitationBadge Atom', () => {
  beforeEach(() => {
    usePlayerStore.getState().seek(0);
  });

  it('renders formatted timestamp [MM:SS]', () => {
    render(<CitationBadge timestamp={75} />);
    expect(screen.getByText('[01:15]')).toBeInTheDocument();
  });

  it('triggers custom onClick handler when provided', () => {
    const handleClick = vi.fn();
    render(<CitationBadge timestamp={120} onClick={handleClick} />);

    const badge = screen.getByTestId('citation-badge');
    fireEvent.click(badge);
    expect(handleClick).toHaveBeenCalledWith(120);
  });

  it('calls player store seek method when no custom onClick is provided', () => {
    render(<CitationBadge timestamp={200} />);

    const badge = screen.getByTestId('citation-badge');
    fireEvent.click(badge);
    expect(usePlayerStore.getState().currentTime).toBe(200);
  });
});
