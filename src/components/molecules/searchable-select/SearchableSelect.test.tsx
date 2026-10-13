import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchableSelect, SearchableSelectOption } from './SearchableSelect';

const sampleOptions: SearchableSelectOption[] = [
  { value: '', label: 'Semua Template' },
  { value: 'GENERAL', label: 'General Meeting', description: 'Notula rapat umum' },
  { value: 'DAILY_STANDUP', label: 'Daily Standup', description: 'Sinkronisasi harian tim' },
  { value: 'INTERVIEW', label: 'Job Interview', description: 'Wawancara kerja & evaluasi kandidat' },
  { value: 'ONE_ON_ONE', label: '1-on-1 Feedback', description: 'Pertemuan satu lawan satu' },
];

describe('SearchableSelect Molecule', () => {
  it('renders trigger with placeholder when no value selected', () => {
    render(
      <SearchableSelect
        value=""
        onValueChange={vi.fn()}
        options={sampleOptions}
        placeholder="Pilih template..."
        data-testid="template-select"
      />
    );

    expect(screen.getByTestId('template-select')).toBeInTheDocument();
    expect(screen.getByTestId('template-select-trigger')).toHaveTextContent('Semua Template');
  });

  it('renders selected option label on trigger', () => {
    render(
      <SearchableSelect
        value="INTERVIEW"
        onValueChange={vi.fn()}
        options={sampleOptions}
        data-testid="template-select"
      />
    );

    expect(screen.getByTestId('template-select-trigger')).toHaveTextContent('Job Interview');
  });

  it('triggers onValueChange on hidden select change event for test compatibility', () => {
    const handleChange = vi.fn();
    render(
      <SearchableSelect
        value="GENERAL"
        onValueChange={handleChange}
        options={sampleOptions}
        data-testid="template-select"
      />
    );

    const hiddenSelect = screen.getByTestId('template-select');
    fireEvent.change(hiddenSelect, { target: { value: 'DAILY_STANDUP' } });

    expect(handleChange).toHaveBeenCalledWith('DAILY_STANDUP');
  });

  it('opens popover when trigger is clicked', () => {
    render(
      <SearchableSelect
        value=""
        onValueChange={vi.fn()}
        options={sampleOptions}
        searchPlaceholder="Cari template..."
        data-testid="template-select"
      />
    );

    const trigger = screen.getByTestId('template-select-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('template-select-search-input')).toBeInTheDocument();
  });

  it('selects option when clicked in popover', () => {
    const handleChange = vi.fn();
    render(
      <SearchableSelect
        value=""
        onValueChange={handleChange}
        options={sampleOptions}
        data-testid="template-select"
      />
    );

    const trigger = screen.getByTestId('template-select-trigger');
    fireEvent.click(trigger);

    const interviewOption = screen.getByTestId('template-select-option-INTERVIEW');
    fireEvent.click(interviewOption);

    expect(handleChange).toHaveBeenCalledWith('INTERVIEW');
  });

  it('clears selection when clear button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <SearchableSelect
        value="DAILY_STANDUP"
        onValueChange={handleChange}
        options={sampleOptions}
        clearable
        data-testid="template-select"
      />
    );

    const clearButton = screen.getByLabelText('Clear selection');
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });
});
