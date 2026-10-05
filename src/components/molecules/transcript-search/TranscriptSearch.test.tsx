import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TranscriptSearch } from './TranscriptSearch';

describe('TranscriptSearch Component', () => {
  it('renders search input with placeholder', () => {
    render(
      <TranscriptSearch
        value=""
        onChange={vi.fn()}
        placeholder="Cari transkripsi..."
      />
    );

    const input = screen.getByPlaceholderText('Cari transkripsi...');
    expect(input).toBeDefined();
    expect(screen.queryByTestId('search-match-counter')).toBeNull();
  });

  it('displays match counter and next/prev buttons when query is present', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();

    render(
      <TranscriptSearch
        value="anggaran"
        onChange={vi.fn()}
        matchCount={5}
        currentMatchIndex={1}
        onNextMatch={onNext}
        onPrevMatch={onPrev}
      />
    );

    expect(screen.getByTestId('search-match-counter').textContent).toBe('2/5');

    const nextBtn = screen.getByTestId('next-match-button');
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalledTimes(1);

    const prevBtn = screen.getByTestId('prev-match-button');
    fireEvent.click(prevBtn);
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('clears query when clear button is clicked', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();

    render(
      <TranscriptSearch
        value="query"
        onChange={onChange}
        onClear={onClear}
      />
    );

    const clearBtn = screen.getByTestId('clear-search-button');
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('triggers next/prev on Enter / Shift+Enter keypress', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();

    render(
      <TranscriptSearch
        value="test"
        onChange={vi.fn()}
        matchCount={3}
        onNextMatch={onNext}
        onPrevMatch={onPrev}
      />
    );

    const input = screen.getByTestId('transcript-search-input');

    // Press Enter -> onNextMatch
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(onNext).toHaveBeenCalledTimes(1);

    // Press Shift+Enter -> onPrevMatch
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onPrev).toHaveBeenCalledTimes(1);
  });
});
