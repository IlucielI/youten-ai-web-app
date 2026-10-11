import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './security.middleware';
import { REQUEST_ID_HEADER } from '../context/request.context';
import { CLIENT_IP_HEADER } from './client-meta.middleware';

describe('applySecurityHeaders Middleware', () => {
  it('attaches security headers including microphone=(self) permissions policy', () => {
    const response = new NextResponse();
    applySecurityHeaders(response, 'req-test-123', '127.0.0.1');

    expect(response.headers.get(REQUEST_ID_HEADER)).toBe('req-test-123');
    expect(response.headers.get(CLIENT_IP_HEADER)).toBe('127.0.0.1');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(self), geolocation=()'
    );
  });
});
