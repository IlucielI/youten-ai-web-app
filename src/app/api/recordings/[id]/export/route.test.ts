import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './route';

describe('/api/recordings/[id]/export route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports PDF with valid application/pdf Content-Type and PDF-1.4 magic bytes in fallback mode', async () => {
    const req = new Request('http://localhost/api/recordings/rec-123/export?format=pdf', {
      method: 'GET',
    });

    const res = await GET(req, { params: Promise.resolve({ id: 'rec-123' }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('recording-rec-123.pdf');

    const buffer = await res.arrayBuffer();
    const textPrefix = new TextDecoder().decode(buffer.slice(0, 8));
    expect(textPrefix).toBe('%PDF-1.4');
  });

  it('exports JSON with application/json Content-Type', async () => {
    const req = new Request('http://localhost/api/recordings/rec-123/export?format=json', {
      method: 'GET',
    });

    const res = await GET(req, { params: Promise.resolve({ id: 'rec-123' }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');

    const json = await res.json();
    expect(json.id).toBe('rec-123');
    expect(json.format).toBe('json');
  });

  it('exports Markdown with markdown text Content-Type', async () => {
    const req = new Request('http://localhost/api/recordings/rec-123/export?format=markdown', {
      method: 'GET',
    });

    const res = await GET(req, { params: Promise.resolve({ id: 'rec-123' }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/markdown');

    const text = await res.text();
    expect(text).toContain('# Recording rec-123');
  });
});
