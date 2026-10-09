import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportMenu } from './ExportMenu';
import { ExportFormat } from '@/server/constants/recording.constant';

describe('ExportMenu', () => {
  it('renders export trigger button', () => {
    render(<ExportMenu />);
    expect(screen.getByTestId('export-menu-trigger')).toHaveTextContent('Ekspor');
  });

  it('displays all 4 export format options when dropdown is triggered', () => {
    render(<ExportMenu open={true} />);

    expect(screen.getByTestId(`export-option-${ExportFormat.PDF}`)).toBeInTheDocument();
    expect(screen.getByTestId(`export-option-${ExportFormat.MARKDOWN}`)).toBeInTheDocument();
    expect(screen.getByTestId(`export-option-${ExportFormat.TXT}`)).toBeInTheDocument();
    expect(screen.getByTestId(`export-option-${ExportFormat.JSON}`)).toBeInTheDocument();
  });

  it('triggers onExport with PDF format when selected by Pro member', async () => {
    const handleExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportMenu open={true} isPro={true} onExport={handleExport} />);

    const pdfOption = screen.getByTestId(`export-option-${ExportFormat.PDF}`);
    fireEvent.click(pdfOption);

    await waitFor(() => {
      expect(handleExport).toHaveBeenCalledWith(ExportFormat.PDF);
    });
  });

  it('triggers onExport with Markdown format when selected', async () => {
    const handleExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportMenu open={true} onExport={handleExport} />);

    const mdOption = screen.getByTestId(`export-option-${ExportFormat.MARKDOWN}`);
    fireEvent.click(mdOption);

    await waitFor(() => {
      expect(handleExport).toHaveBeenCalledWith(ExportFormat.MARKDOWN);
    });
  });

  it('disables trigger button when disabled prop is true', () => {
    render(<ExportMenu disabled={true} />);
    expect(screen.getByTestId('export-menu-trigger')).toBeDisabled();
  });

  it('displays version number in header when currentVersion is provided', () => {
    render(<ExportMenu open={true} currentVersion={2} />);
    expect(screen.getByText('PILIH FORMAT EKSPOR (VERSI 2)')).toBeInTheDocument();
  });

  it('renders PRO badge on PDF export option', () => {
    render(<ExportMenu open={true} />);
    expect(screen.getByTestId('pdf-pro-badge')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-pro-badge')).toHaveTextContent('PRO');
  });

  it('prompts upgrade when isPro is false or undefined and PDF is selected', async () => {
    const handleExport = vi.fn();
    const handleUpgradePrompt = vi.fn();

    // 1. Explicit false
    const { unmount } = render(
      <ExportMenu
        open={true}
        isPro={false}
        onExport={handleExport}
        onUpgradePrompt={handleUpgradePrompt}
      />
    );

    const pdfOption = screen.getByTestId(`export-option-${ExportFormat.PDF}`);
    fireEvent.click(pdfOption);

    expect(handleUpgradePrompt).toHaveBeenCalledTimes(1);
    expect(handleExport).not.toHaveBeenCalled();
    unmount();

    // 2. Undefined (fail-closed security default)
    const handleUpgradePrompt2 = vi.fn();
    render(
      <ExportMenu
        open={true}
        onExport={handleExport}
        onUpgradePrompt={handleUpgradePrompt2}
      />
    );
    fireEvent.click(screen.getByTestId(`export-option-${ExportFormat.PDF}`));
    expect(handleUpgradePrompt2).toHaveBeenCalledTimes(1);
    expect(handleExport).not.toHaveBeenCalled();
  });
});

