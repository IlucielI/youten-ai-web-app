import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadToStorageWithProgress } from './storage-upload';

describe('uploadToStorageWithProgress', () => {
  const originalXHR = global.XMLHttpRequest;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.XMLHttpRequest = originalXHR;
    global.fetch = originalFetch;
  });

  it('uploads file successfully via XMLHttpRequest and emits progress', async () => {
    const progressSpy = vi.fn();
    const openSpy = vi.fn();
    const setHeaderSpy = vi.fn();
    const sendSpy = vi.fn();

    class SuccessMockXHR {
      upload = { onprogress: null as ((evt: unknown) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      ontimeout: (() => void) | null = null;
      onabort: (() => void) | null = null;
      status = 200;
      statusText = 'OK';
      timeout = 0;

      open = openSpy;
      setRequestHeader = setHeaderSpy;
      send = sendSpy.mockImplementation(() => {
        if (this.upload.onprogress) {
          this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
        }
        if (this.onload) {
          this.onload();
        }
      });
    }

    global.XMLHttpRequest = SuccessMockXHR as unknown as typeof XMLHttpRequest;

    const file = new File(['audio content'], 'meeting.m4a', { type: 'audio/mp4' });
    await uploadToStorageWithProgress('https://s3.example.com/bucket/key', file, {
      contentType: 'audio/mp4',
      onProgress: progressSpy,
    });

    expect(openSpy).toHaveBeenCalledWith('PUT', 'https://s3.example.com/bucket/key', true);
    expect(setHeaderSpy).toHaveBeenCalledWith('Content-Type', 'audio/mp4');
    expect(sendSpy).toHaveBeenCalledWith(file);
    expect(progressSpy).toHaveBeenCalledWith(50);
    expect(progressSpy).toHaveBeenCalledWith(100);
  });

  it('rejects when XMLHttpRequest times out', async () => {
    class TimeoutMockXHR {
      upload = { onprogress: null as ((evt: unknown) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      ontimeout: (() => void) | null = null;
      onabort: (() => void) | null = null;
      status = 0;
      statusText = '';
      timeout = 0;

      open = vi.fn();
      setRequestHeader = vi.fn();
      send = vi.fn().mockImplementation(() => {
        if (this.ontimeout) {
          this.ontimeout();
        }
      });
    }

    global.XMLHttpRequest = TimeoutMockXHR as unknown as typeof XMLHttpRequest;

    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    await expect(
      uploadToStorageWithProgress('https://s3.example.com/bucket/key', file)
    ).rejects.toThrow('Storage upload timed out');
  });

  it('rejects when server returns non-2xx status on remote S3 without retrying 4xx', async () => {
    class ForbiddenMockXHR {
      upload = { onprogress: null as ((evt: unknown) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      ontimeout: (() => void) | null = null;
      onabort: (() => void) | null = null;
      status = 403;
      statusText = 'Forbidden';
      timeout = 0;

      open = vi.fn();
      setRequestHeader = vi.fn();
      send = vi.fn().mockImplementation(() => {
        if (this.onload) {
          this.onload();
        }
      });
    }

    global.XMLHttpRequest = ForbiddenMockXHR as unknown as typeof XMLHttpRequest;

    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    await expect(
      uploadToStorageWithProgress('https://s3.example.com/bucket/key', file)
    ).rejects.toThrow('Storage upload failed with status 403');
  });

  it('falls back to proxy upload when direct XMLHttpRequest encounters network error', async () => {
    const progressSpy = vi.fn();
    let xhrCallCount = 0;

    class FallbackMockXHR {
      upload = { onprogress: null as ((evt: unknown) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      ontimeout: (() => void) | null = null;
      onabort: (() => void) | null = null;
      status = 0;
      statusText = '';
      timeout = 0;

      open = vi.fn((method: string, url: string) => {
        xhrCallCount++;
        if (xhrCallCount === 1) {
          // Direct XHR fails
          expect(method).toBe('PUT');
          expect(url).toBe('https://s3.example.com/bucket/key');
        } else {
          // Proxy XHR succeeds
          expect(method).toBe('POST');
          expect(url).toBe('/api/recordings/proxy-upload');
        }
      });
      setRequestHeader = vi.fn();
      send = vi.fn().mockImplementation(() => {
        if (xhrCallCount === 1) {
          // Simulate direct XHR network error (e.g. CORS block / adblocker)
          if (this.onerror) this.onerror();
        } else {
          // Simulate proxy success
          this.status = 200;
          this.statusText = 'OK';
          if (this.onload) this.onload();
        }
      });
    }

    global.XMLHttpRequest = FallbackMockXHR as unknown as typeof XMLHttpRequest;

    const file = new File(['test audio'], 'voice.mp4', { type: 'video/mp4' });
    await uploadToStorageWithProgress('https://s3.example.com/bucket/key', file, {
      contentType: 'video/mp4',
      onProgress: progressSpy,
      proxyUrl: '/api/recordings/proxy-upload',
    });

    expect(xhrCallCount).toBe(2);
    expect(progressSpy).toHaveBeenCalledWith(100);
  });

  it('falls back to direct fetch upload if proxy upload also fails', async () => {
    class NetworkErrorMockXHR {
      upload = { onprogress: null as ((evt: unknown) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      ontimeout: (() => void) | null = null;
      onabort: (() => void) | null = null;
      status = 0;
      statusText = '';
      timeout = 0;

      open = vi.fn();
      setRequestHeader = vi.fn();
      send = vi.fn().mockImplementation(() => {
        if (this.onerror) this.onerror();
      });
    }

    global.XMLHttpRequest = NetworkErrorMockXHR as unknown as typeof XMLHttpRequest;
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = fetchSpy as unknown as typeof fetch;

    const file = new File(['test audio'], 'voice.mp4', { type: 'video/mp4' });
    await uploadToStorageWithProgress('https://s3.example.com/bucket/key', file, {
      contentType: 'video/mp4',
      proxyUrl: '/api/recordings/proxy-upload',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://s3.example.com/bucket/key',
      expect.objectContaining({
        method: 'PUT',
        body: file,
      })
    );
  });

  it('rejects with descriptive error when direct XHR, proxy, and fetch all fail', async () => {
    class AlwaysErrorMockXHR {
      upload = { onprogress: null as ((evt: unknown) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      ontimeout: (() => void) | null = null;
      onabort: (() => void) | null = null;
      status = 0;
      statusText = '';
      timeout = 0;

      open = vi.fn();
      setRequestHeader = vi.fn();
      send = vi.fn().mockImplementation(() => {
        if (this.onerror) this.onerror();
      });
    }

    global.XMLHttpRequest = AlwaysErrorMockXHR as unknown as typeof XMLHttpRequest;
    global.fetch = vi.fn().mockRejectedValue(new Error('Fetch network error'));

    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    await expect(
      uploadToStorageWithProgress('https://s3.example.com/bucket/key', file, {
        proxyUrl: '/api/recordings/proxy-upload',
      })
    ).rejects.toThrow('Network error occurred while uploading file to storage');
  });

  it('uploads via fetch directly in environments without XMLHttpRequest', async () => {
    // @ts-expect-error intentionally removing XMLHttpRequest to test node/headless environment
    delete global.XMLHttpRequest;

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = fetchSpy as unknown as typeof fetch;

    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    await uploadToStorageWithProgress('https://s3.example.com/bucket/key', file, {
      contentType: 'audio/mpeg',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://s3.example.com/bucket/key',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'audio/mpeg' },
        body: file,
      })
    );
  });
});
