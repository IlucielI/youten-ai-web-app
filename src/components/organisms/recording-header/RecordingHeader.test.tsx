import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordingHeader } from './RecordingHeader';

describe('RecordingHeader', () => {
  const defaultProps = {
    id: 'rec-12345-abcde',
    title: 'Simulasi Interview Kerja',
    selectedTemplate: 'INTERVIEW',
    durationSeconds: 370,
    createdAt: '2026-10-14T00:00:00Z',
    onOpenShare: vi.fn(),
    onExport: vi.fn(),
    onToggleChat: vi.fn(),
  };

  it('renders title, breadcrumb ID, template badge, and formatted duration', () => {
    render(<RecordingHeader {...defaultProps} />);

    expect(screen.getByTestId('recording-title')).toHaveTextContent('Simulasi Interview Kerja');
    expect(screen.getByText('ID: rec-12345-abcde')).toBeInTheDocument();
    expect(screen.getByText('INTERVIEW')).toBeInTheDocument();
    expect(screen.getByText('06:10')).toBeInTheDocument();
  });

  it('renders share, export, and ask AI buttons by default', () => {
    render(<RecordingHeader {...defaultProps} />);

    expect(screen.getByTestId('open-share-dialog-btn')).toBeInTheDocument();
    expect(screen.getByTestId('export-menu-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-chat-panel-btn')).toBeInTheDocument();
  });

  it('hides share and ask AI button when showShare=false and showAskAi=false (Share page mode)', () => {
    render(
      <RecordingHeader
        {...defaultProps}
        showShare={false}
        showAskAi={false}
      />
    );

    expect(screen.queryByTestId('open-share-dialog-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('toggle-chat-panel-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('export-menu-trigger')).toBeInTheDocument();
  });

  it('triggers onOpenShare and onToggleChat callbacks', () => {
    const handleShare = vi.fn();
    const handleChat = vi.fn();

    render(
      <RecordingHeader
        {...defaultProps}
        onOpenShare={handleShare}
        onToggleChat={handleChat}
      />
    );

    fireEvent.click(screen.getByTestId('open-share-dialog-btn'));
    expect(handleShare).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('toggle-chat-panel-btn'));
    expect(handleChat).toHaveBeenCalledTimes(1);
  });
});
