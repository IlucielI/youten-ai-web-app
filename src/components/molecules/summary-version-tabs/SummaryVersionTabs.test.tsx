import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SummaryVersionTabs } from './SummaryVersionTabs';

describe('SummaryVersionTabs Molecule', () => {
  const sampleVersions = [
    {
      id: 'ver-1',
      version: 1,
      template_category: 'GENERAL',
      is_active: false,
    },
    {
      id: 'ver-2',
      version: 2,
      template_category: 'MOM',
      is_active: true,
    },
  ];

  it('renders nothing when versions array is empty', () => {
    const { container } = render(
      <SummaryVersionTabs
        versions={[]}
        selectedVersionId=""
        onSelectVersion={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders version tabs with correct labels and highlights selected version', () => {
    render(
      <SummaryVersionTabs
        versions={sampleVersions}
        selectedVersionId="ver-1"
        onSelectVersion={vi.fn()}
      />
    );

    expect(screen.getByTestId('version-tab-1')).toBeInTheDocument();
    expect(screen.getByTestId('version-tab-2')).toBeInTheDocument();
    expect(screen.getByTestId('version-cap-counter')).toHaveTextContent('2/5 versi');
  });

  it('fires onSelectVersion callback when a tab is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <SummaryVersionTabs
        versions={sampleVersions}
        selectedVersionId="ver-1"
        onSelectVersion={handleSelect}
      />
    );

    fireEvent.click(screen.getByTestId('version-tab-2'));
    expect(handleSelect).toHaveBeenCalledWith('ver-2');
  });

  it('shows "Jadikan Aktif" button when selected version is not active and triggers callback', () => {
    const handleActivate = vi.fn();
    render(
      <SummaryVersionTabs
        versions={sampleVersions}
        selectedVersionId="ver-1"
        onSelectVersion={vi.fn()}
        onActivateVersion={handleActivate}
      />
    );

    const activateBtn = screen.getByTestId('activate-version-btn');
    expect(activateBtn).toBeInTheDocument();
    fireEvent.click(activateBtn);
    expect(handleActivate).toHaveBeenCalledWith('ver-1');
  });

  it('hides "Jadikan Aktif" button when selected version is already active', () => {
    render(
      <SummaryVersionTabs
        versions={sampleVersions}
        selectedVersionId="ver-2"
        onSelectVersion={vi.fn()}
        onActivateVersion={vi.fn()}
      />
    );

    expect(screen.queryByTestId('activate-version-btn')).not.toBeInTheDocument();
  });

  it('triggers onOpenRegenerate when "Generate Baru" button is clicked', () => {
    const handleRegenerate = vi.fn();
    render(
      <SummaryVersionTabs
        versions={sampleVersions}
        selectedVersionId="ver-2"
        onSelectVersion={vi.fn()}
        onOpenRegenerate={handleRegenerate}
      />
    );

    const btn = screen.getByTestId('open-regenerate-modal-btn');
    fireEvent.click(btn);
    expect(handleRegenerate).toHaveBeenCalled();
  });

  it('disables "Generate Baru" button when version cap of 5 is reached', () => {
    const fiveVersions = [1, 2, 3, 4, 5].map((v) => ({
      id: `ver-${v}`,
      version: v,
      template_category: 'MOM',
      is_active: v === 5,
    }));

    render(
      <SummaryVersionTabs
        versions={fiveVersions}
        selectedVersionId="ver-5"
        onSelectVersion={vi.fn()}
        onOpenRegenerate={vi.fn()}
      />
    );

    const btn = screen.getByTestId('open-regenerate-modal-btn');
    expect(btn).toBeDisabled();
    expect(screen.getByTestId('version-cap-counter')).toHaveTextContent('5/5 versi');
  });
});
