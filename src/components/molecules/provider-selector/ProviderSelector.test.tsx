import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderSelector } from './ProviderSelector';
import { BotProvider } from '@/server/constants/recording.constant';

describe('ProviderSelector', () => {
  it('renders all 4 meeting providers', () => {
    const onSelect = vi.fn();
    render(
      <ProviderSelector
        selectedProvider={BotProvider.GOOGLE_MEET}
        onSelectProvider={onSelect}
      />
    );

    expect(screen.getByTestId('provider-option-google_meet')).toBeInTheDocument();
    expect(screen.getByTestId('provider-option-zoom')).toBeInTheDocument();
    expect(screen.getByTestId('provider-option-ms_teams')).toBeInTheDocument();
    expect(screen.getByTestId('provider-option-discord')).toBeInTheDocument();
    expect(screen.getByTestId('provider-selected-indicator-google_meet')).toBeInTheDocument();
  });

  it('triggers onSelectProvider when clicking another provider', () => {
    const onSelect = vi.fn();
    render(
      <ProviderSelector
        selectedProvider={BotProvider.GOOGLE_MEET}
        onSelectProvider={onSelect}
      />
    );

    fireEvent.click(screen.getByTestId('provider-option-zoom'));
    expect(onSelect).toHaveBeenCalledWith(BotProvider.ZOOM);
  });

  it('displays status based on capabilities', () => {
    render(
      <ProviderSelector
        selectedProvider={BotProvider.GOOGLE_MEET}
        onSelectProvider={vi.fn()}
        capabilities={{
          google_meet: 'available',
          zoom: 'coming_soon',
          ms_teams: 'available',
          discord: 'available',
        }}
      />
    );

    expect(screen.getByTestId('provider-status-google_meet')).toHaveTextContent('Siap Pakai');
    expect(screen.getByTestId('provider-status-zoom')).toHaveTextContent('Beta');
  });
});
