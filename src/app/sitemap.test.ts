import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it('should return sitemap with default baseUrl', () => {
    const res = sitemap();
    expect(res).toHaveLength(4);
    expect(res[0].url).toBe('https://youten.bayuanugerah.my.id');
    expect(res[0].priority).toBe(1.0);
    expect(res[1].url).toBe('https://youten.bayuanugerah.my.id/login');
    expect(res[2].url).toBe('https://youten.bayuanugerah.my.id/register');
    expect(res[3].url).toBe('https://youten.bayuanugerah.my.id/forgot-password');
  });

  it('should return sitemap with custom NEXT_PUBLIC_APP_URL when set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://custom-domain.com';
    const res = sitemap();
    expect(res[0].url).toBe('https://custom-domain.com');
    expect(res[1].url).toBe('https://custom-domain.com/login');
  });
});

