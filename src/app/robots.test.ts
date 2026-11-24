import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import robots from './robots';

describe('robots', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it('should return robots config with default baseUrl when env is not set', () => {
    const res = robots();
    expect(res.sitemap).toBe('https://youten.bayuanugerah.my.id/sitemap.xml');
    expect(res.rules).toEqual([
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/forgot-password'],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/recordings',
          '/recordings/*',
          '/settings',
          '/settings/*',
          '/api/*',
        ],
      },
    ]);
  });

  it('should return robots config with custom NEXT_PUBLIC_APP_URL when set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://custom-domain.com';
    const res = robots();
    expect(res.sitemap).toBe('https://custom-domain.com/sitemap.xml');
  });
});

