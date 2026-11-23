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

  it('displays all 5 export format options when dropdown is triggered', () => {
    render(<ExportMenu open={true} />);

    expect(screen.getByTestId(`export-option-${ExportFormat.DOCX}`)).toBeInTheDocument();
    expect(screen.getByTestId(`export-option-${ExportFormat.PDF}`)).toBeInTheDocument();
    expect(screen.getByTestId(`export-option-${ExportFormat.MARKDOWN}`)).toBeInTheDocument();
    expect(screen.getByTestId(`export-option-${ExportFormat.TXT}`)).toBeInTheDocument();
    expect(screen.getByTestId(`export-option-${ExportFormat.JSON}`)).toBeInTheDocument();
  });

  it('triggers onExport with DOCX format when selected', async () => {
    const handleExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportMenu open={true} onExport={handleExport} />);

    const docxOption = screen.getByTestId(`export-option-${ExportFormat.DOCX}`);
    fireEvent.click(docxOption);

    await waitFor(() => {
      expect(handleExport).toHaveBeenCalledWith(ExportFormat.DOCX);
    });
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

  it('does not render PRO badge on PDF export option', () => {
    render(<ExportMenu open={true} />);
    expect(screen.queryByTestId('pdf-pro-badge')).not.toBeInTheDocument();
  });

  it('prompts upgrade when isPro is false and onUpgradePrompt is provided', async () => {
    const handleExport = vi.fn();
    const handleUpgradePrompt = vi.fn();

    render(
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
  });

  it('triggers onExport with PDF format when isPro is false but onUpgradePrompt is not provided', async () => {
    const handleExport = vi.fn();

    render(
      <ExportMenu
        open={true}
        isPro={false}
        onExport={handleExport}
      />
    );

    const pdfOption = screen.getByTestId(`export-option-${ExportFormat.PDF}`);
    fireEvent.click(pdfOption);

    expect(handleExport).toHaveBeenCalledWith(ExportFormat.PDF);
  });

  it('triggers onExport with PDF format when isPro is omitted', async () => {
    const handleExport = vi.fn();

    render(
      <ExportMenu
        open={true}
        onExport={handleExport}
      />
    );

    const pdfOption = screen.getByTestId(`export-option-${ExportFormat.PDF}`);
    fireEvent.click(pdfOption);

    expect(handleExport).toHaveBeenCalledWith(ExportFormat.PDF);
  });

  it('triggers direct download link with version parameter when currentVersion is provided', async () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    render(
      <ExportMenu
        open={true}
        recordingId="rec-test-123"
        currentVersion={3}
      />
    );

    const mdOption = screen.getByTestId(`export-option-${ExportFormat.MARKDOWN}`);
    fireEvent.click(mdOption);

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });

    vi.restoreAllMocks();
  });
});


