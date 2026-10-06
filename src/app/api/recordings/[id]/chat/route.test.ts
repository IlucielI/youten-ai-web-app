import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

describe('POST /api/recordings/[id]/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/recordings/rec-1/chat', {
      method: 'POST',
      body: 'invalid-json',
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'rec-1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid JSON body');
  });

  it('returns 400 when message is empty or missing', async () => {
    const req = new Request('http://localhost/api/recordings/rec-1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'rec-1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Message cannot be empty');
  });

  it('returns SSE stream in test/mock mode with token and done events', async () => {
    const req = new Request('http://localhost/api/recordings/rec-1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ownership-token': 'guest-token-123',
      },
      body: JSON.stringify({
        message: 'Apa kesimpulan dari rapat ini?',
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'rec-1' }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.headers.get('Cache-Control')).toContain('no-cache');

    const text = await res.text();
    expect(text).toContain('event: token');
    expect(text).toContain('event: done');
    expect(text).toContain('00:15');
  });
});
