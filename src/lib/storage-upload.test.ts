import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadToStorageWithProgress } from './storage-upload';

describe('uploadToStorageWithProgress', () => {
  const originalXHR = global.XMLHttpRequest;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.XMLHttpRequest = originalXHR;
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

  it('rejects when XMLHttpRequest encounters network error', async () => {
    class ErrorMockXHR {
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
        if (this.onerror) {
          this.onerror();
        }
      });
    }

    global.XMLHttpRequest = ErrorMockXHR as unknown as typeof XMLHttpRequest;

    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    await expect(
      uploadToStorageWithProgress('https://s3.example.com/bucket/key', file)
    ).rejects.toThrow('Network error occurred');
  });

  it('rejects when server returns non-2xx status on remote S3', async () => {
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
});
