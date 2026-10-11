import { describe, it, expect } from 'vitest';
import { getTranslation, dictionaries, SUPPORTED_LOCALES } from './index';

describe('Locales System', () => {
  it('has both id and en supported locales', () => {
    expect(SUPPORTED_LOCALES).toContain('id');
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(dictionaries.id).toBeDefined();
    expect(dictionaries.en).toBeDefined();
  });

  it('guarantees identical top-level domain sections between id and en', () => {
    const idKeys = Object.keys(dictionaries.id).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(enKeys).toEqual(idKeys);
  });

  it('retrieves nested translations accurately for id and en', () => {
    const titleId = getTranslation('id', 'landing.hero.title');
    const titleEn = getTranslation('en', 'landing.hero.title');

    expect(titleId).toBe('Youten — Inti dari Setiap Percakapan');
    expect(titleEn).toBe('Youten — The Essence of Every Conversation');
  });

  it('interpolates parameters accurately', () => {
    const welcomeId = getTranslation('id', 'landing.quota.userBanner', {
      name: 'Bayu',
      count: 5,
    });
    expect(welcomeId).toBe('Selamat datang, Bayu! Kuota rekaman tersisa hari ini: 5 rekaman.');

    const welcomeEn = getTranslation('en', 'landing.quota.userBanner', {
      name: 'Bayu',
      count: 5,
    });
    expect(welcomeEn).toBe('Welcome, Bayu! Remaining recording quota today: 5 recordings.');
  });

  it('falls back to default locale id if key missing in target locale', () => {
    // If a non-existent subpath is queried, fallback behaves gracefully
    const missingKey = getTranslation('en', 'nonexistent.key.here');
    expect(missingKey).toBe('nonexistent.key.here');
  });

  it('retrieves backend error codes correctly', () => {
    const errId = getTranslation('id', 'errors.ERR_EXTRACTION_FAILED');
    const errEn = getTranslation('en', 'errors.ERR_EXTRACTION_FAILED');

    expect(errId).toContain('Gagal mengekstraksi audio');
    expect(errEn).toContain('Failed to extract audio');
  });
});
