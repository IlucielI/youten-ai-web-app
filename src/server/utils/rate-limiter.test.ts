import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRateLimiter } from './rate-limiter';

describe('MemoryRateLimiter', () => {
  let limiter: MemoryRateLimiter;

  beforeEach(() => {
    limiter = new MemoryRateLimiter(3, 1000); // 3 requests per 1000ms
  });

  it('allows requests within limit', () => {
    const res1 = limiter.check('127.0.0.1');
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.check('127.0.0.1');
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.check('127.0.0.1');
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it('blocks requests exceeding limit and reports retryAfterSeconds', () => {
    limiter.check('127.0.0.1');
    limiter.check('127.0.0.1');
    limiter.check('127.0.0.1');

    const blocked = limiter.check('127.0.0.1');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('isolates different keys', () => {
    limiter.check('127.0.0.1');
    limiter.check('127.0.0.1');
    limiter.check('127.0.0.1');

    // Different IP should still be allowed
    const other = limiter.check('192.168.1.1');
    expect(other.allowed).toBe(true);
    expect(other.remaining).toBe(2);
  });
});
