import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';

describe('/api/recordings/[id]/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
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

    it('returns SSE stream in test/mock mode with session, token, and done events', async () => {
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
      expect(text).toContain('event: session');
      expect(text).toContain('event: token');
      expect(text).toContain('event: done');
      expect(text).toContain('00:15');
    });
  });

  describe('GET', () => {
    it('returns 400 when session_id query param is missing', async () => {
      const req = new Request('http://localhost/api/recordings/rec-1/chat', {
        method: 'GET',
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'rec-1' }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('session_id');
    });

    it('returns 200 with chat history envelope in test/mock mode', async () => {
      const req = new Request(
        'http://localhost/api/recordings/rec-1/chat?session_id=00000000-0000-0000-0000-000000000001',
        {
          method: 'GET',
        }
      );

      const res = await GET(req, { params: Promise.resolve({ id: 'rec-1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(Array.isArray(json.data)).toBe(true);
    });
  });
});
