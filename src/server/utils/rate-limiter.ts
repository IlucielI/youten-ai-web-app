interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class MemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();

  constructor(
    public readonly maxRequests: number,
    public readonly windowMs: number
  ) {
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of this.records.entries()) {
          if (now > record.resetAt) {
            this.records.delete(key);
          }
        }
      }, 60 * 1000);
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    }
  }

  check(key: string): RateLimitCheckResult {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetAt) {
      this.records.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        allowed: true,
        remaining: Math.max(0, this.maxRequests - 1),
        retryAfterSeconds: 0,
      };
    }

    if (record.count >= this.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - record.count),
      retryAfterSeconds: 0,
    };
  }

  reset(): void {
    this.records.clear();
  }
}
