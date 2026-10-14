import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '@/components/atoms/tabs';
import { RecordingTabs } from './RecordingTabs';

describe('RecordingTabs', () => {
  const renderWithTabs = (props: React.ComponentProps<typeof RecordingTabs>) => {
    return render(
      <Tabs value={props.activeTab}>
        <RecordingTabs {...props} />
      </Tabs>
    );
  };

  it('renders all four tabs with labels and counts', () => {
    renderWithTabs({
      activeTab: 'summary',
      onTabChange: vi.fn(),
      segmentsCount: 42,
      chaptersCount: 5,
    });

    expect(screen.getByTestId('tab-trigger-summary')).toBeInTheDocument();
    expect(screen.getByTestId('tab-trigger-transcript')).toHaveTextContent('(42)');
    expect(screen.getByTestId('tab-trigger-chapters')).toHaveTextContent('(5)');
    expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
  });

  it('calls onTabChange when tabs are clicked', () => {
    const handleTabChange = vi.fn();
    renderWithTabs({
      activeTab: 'summary',
      onTabChange: handleTabChange,
    });

    fireEvent.click(screen.getByTestId('tab-trigger-analytics'));
    expect(handleTabChange).toHaveBeenCalledWith('analytics');

    fireEvent.click(screen.getByTestId('tab-trigger-transcript'));
    expect(handleTabChange).toHaveBeenCalledWith('transcript');

    fireEvent.click(screen.getByTestId('tab-trigger-chapters'));
    expect(handleTabChange).toHaveBeenCalledWith('chapters');
  });
});
