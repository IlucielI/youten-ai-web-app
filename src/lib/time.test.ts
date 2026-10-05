import { describe, it, expect } from 'vitest';
import { formatTime, parseTimestamp } from './time';

describe('formatTime', () => {
  it('formats 0 seconds properly', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats invalid or negative inputs as 00:00', () => {
    expect(formatTime(-10)).toBe('00:00');
    expect(formatTime(NaN)).toBe('00:00');
    expect(formatTime(Infinity)).toBe('00:00');
  });

  it('formats minutes and seconds (under 1 hour)', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(599)).toBe('09:59');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatTime(3600)).toBe('01:00:00');
    expect(formatTime(3665)).toBe('01:01:05');
    expect(formatTime(7325)).toBe('02:02:05');
  });
});

describe('parseTimestamp', () => {
  it('parses MM:SS format', () => {
    expect(parseTimestamp('01:05')).toBe(65);
    expect(parseTimestamp('00:45')).toBe(45);
  });

  it('parses HH:MM:SS format', () => {
    expect(parseTimestamp('01:01:05')).toBe(3665);
    expect(parseTimestamp('02:00:00')).toBe(7200);
  });

  it('returns 0 for invalid string', () => {
    expect(parseTimestamp('')).toBe(0);
    expect(parseTimestamp('invalid')).toBe(0);
  });
});
