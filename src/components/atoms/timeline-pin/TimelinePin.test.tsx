import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelinePin } from './TimelinePin';

describe('TimelinePin Atom Component', () => {
  it('renders correctly at the calculated percentage position', () => {
    render(
      <TimelinePin
        timestampSec={30}
        totalDurationSec={120}
        label="Pembahasan arsitektur sistem"
      />
    );

    const container = screen.getByTestId('timeline-pin-container');
    expect(container).toHaveStyle({ left: '25%' });

    const btn = screen.getByTestId('timeline-pin-btn');
    expect(btn).toHaveAttribute(
      'aria-label',
      'Komentar di 00:30: Pembahasan arsitektur sistem'
    );
  });

  it('clamps percentage between 0 and 100 for out-of-bounds duration', () => {
    const { rerender } = render(
      <TimelinePin timestampSec={-10} totalDurationSec={100} />
    );
    expect(screen.getByTestId('timeline-pin-container')).toHaveStyle({ left: '0%' });

    rerender(<TimelinePin timestampSec={150} totalDurationSec={100} />);
    expect(screen.getByTestId('timeline-pin-container')).toHaveStyle({ left: '100%' });

    rerender(<TimelinePin timestampSec={50} totalDurationSec={0} />);
    expect(screen.getByTestId('timeline-pin-container')).toHaveStyle({ left: '0%' });
  });

  it('triggers onClick callback when button is clicked', () => {
    const handleClick = vi.fn();
    render(
      <TimelinePin
        timestampSec={45}
        totalDurationSec={90}
        onClick={handleClick}
      />
    );

    const btn = screen.getByTestId('timeline-pin-btn');
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders comment count badge when commentCount > 1', () => {
    const { rerender } = render(
      <TimelinePin timestampSec={10} totalDurationSec={60} commentCount={3} />
    );
    expect(screen.getByText('3')).toBeInTheDocument();

    rerender(
      <TimelinePin timestampSec={10} totalDurationSec={60} commentCount={12} />
    );
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('applies active styling when isActive is true', () => {
    render(
      <TimelinePin timestampSec={15} totalDurationSec={60} isActive={true} />
    );
    const btn = screen.getByTestId('timeline-pin-btn');
    expect(btn.className).toContain('bg-amber-500');
  });
});
