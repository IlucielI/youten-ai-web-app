import { describe, it, expect, beforeEach } from 'vitest';
import { useLocaleStore } from './locale.store';

describe('useLocaleStore', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'en' });
  });

  it('initializes with default locale en', () => {
    expect(useLocaleStore.getState().locale).toBe('en');
  });

  it('updates locale correctly with setLocale', () => {
    useLocaleStore.getState().setLocale('id');
    expect(useLocaleStore.getState().locale).toBe('id');

    useLocaleStore.getState().setLocale('en');
    expect(useLocaleStore.getState().locale).toBe('en');
  });

  it('toggles between en and id with toggleLocale', () => {
    expect(useLocaleStore.getState().locale).toBe('en');

    useLocaleStore.getState().toggleLocale();
    expect(useLocaleStore.getState().locale).toBe('id');

    useLocaleStore.getState().toggleLocale();
    expect(useLocaleStore.getState().locale).toBe('en');
  });
});
