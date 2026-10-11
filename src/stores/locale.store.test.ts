import { describe, it, expect, beforeEach } from 'vitest';
import { useLocaleStore } from './locale.store';

describe('useLocaleStore', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'id' });
  });

  it('initializes with default locale id', () => {
    expect(useLocaleStore.getState().locale).toBe('id');
  });

  it('updates locale correctly with setLocale', () => {
    useLocaleStore.getState().setLocale('en');
    expect(useLocaleStore.getState().locale).toBe('en');

    useLocaleStore.getState().setLocale('id');
    expect(useLocaleStore.getState().locale).toBe('id');
  });

  it('toggles between id and en with toggleLocale', () => {
    expect(useLocaleStore.getState().locale).toBe('id');

    useLocaleStore.getState().toggleLocale();
    expect(useLocaleStore.getState().locale).toBe('en');

    useLocaleStore.getState().toggleLocale();
    expect(useLocaleStore.getState().locale).toBe('id');
  });
});
