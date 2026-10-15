import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackButton } from './FeedbackButton';
import { useUiStore } from '@/stores/ui.store';

describe('FeedbackButton Molecule', () => {
  beforeEach(() => {
    useUiStore.setState({ activeModal: null });
  });

  it('renders button with label and icon', () => {
    render(<FeedbackButton />);
    const btn = screen.getByTestId('feedback-trigger-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent(/Feedback/i);
  });

  it('triggers custom onClick callback when provided', () => {
    const handleClick = vi.fn();
    render(<FeedbackButton onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('feedback-trigger-btn'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('opens feedback modal in ui store by default when clicked', () => {
    render(<FeedbackButton />);
    expect(useUiStore.getState().activeModal).toBeNull();
    fireEvent.click(screen.getByTestId('feedback-trigger-btn'));
    expect(useUiStore.getState().activeModal).toBe('feedback');
  });

  it('applies inline styles when variant is inline', () => {
    const { container } = render(<FeedbackButton variant="inline" />);
    expect(container.querySelector('button')).not.toHaveClass('fixed');
  });
});
