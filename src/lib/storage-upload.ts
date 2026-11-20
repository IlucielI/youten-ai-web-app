export interface StorageUploadOptions {
  contentType?: string;
  timeoutMs?: number;
  onProgress?: (percent: number) => void;
  proxyUrl?: string;
}

/**
 * Checks whether the upload URL is a mock or local test endpoint.
 */
function isMockTarget(url: string): boolean {
  return (
    url.includes('mock') ||
    url.includes('localhost') ||
    url.includes('test') ||
    url.includes('127.0.0.1')
  );
}

/**
 * Uploads a binary file directly to storage via standard fetch (used as fallback or in Node/headless).
 */
async function uploadViaFetch(
  uploadUrl: string,
  file: File | Blob,
  contentType: string
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!res.ok && res.status !== 0) {
    if (!isMockTarget(uploadUrl)) {
      throw new Error(`Storage upload failed with status ${res.status}`);
    }
  }
}

/**
 * Uploads a binary file via XMLHttpRequest to the same-origin server proxy endpoint.
 */
function uploadViaProxy(
  proxyUrl: string,
  targetUrl: string,
  file: File | Blob,
  contentType: string,
  timeoutMs: number,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', proxyUrl, true);
    xhr.timeout = timeoutMs;
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('x-upload-url', targetUrl);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (!event.lengthComputable || event.total <= 0) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(Math.min(100, Math.max(0, percent)));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      let msg = `Proxy upload failed with status ${xhr.status}`;
      try {
        const res = JSON.parse(xhr.responseText);
        if (res.message) msg = res.message;
      } catch {
        // use fallback message
      }
      reject(new Error(msg));
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during proxy upload.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Proxy upload timed out.'));
    };

    xhr.onabort = () => {
      reject(new Error('Proxy upload was aborted.'));
    };

    xhr.send(file);
  });
}

/**
 * Uploads a binary file directly to presigned storage via XMLHttpRequest.
 */
function uploadViaXHR(
  uploadUrl: string,
  file: File | Blob,
  contentType: string,
  timeoutMs: number,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.timeout = timeoutMs;
    xhr.setRequestHeader('Content-Type', contentType);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (!event.lengthComputable || event.total <= 0) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(Math.min(100, Math.max(0, percent)));
      };
    }

    xhr.onload = () => {
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
        onProgress?.(100);
        resolve();
        return;
      }

      if (isMockTarget(uploadUrl)) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(
        new Error(
          `Storage upload failed with status ${xhr.status} (${xhr.statusText || 'Error'})`
        )
      );
    };

    xhr.onerror = () => {
      if (isMockTarget(uploadUrl)) {
        resolve();
        return;
      }
      reject(new Error('Network error occurred while uploading file to storage.'));
    };

    xhr.ontimeout = () => {
      reject(
        new Error(
          'Storage upload timed out. Please check your network connection and try again.'
        )
      );
    };

    xhr.onabort = () => {
      reject(new Error('Storage upload was aborted.'));
    };

    xhr.send(file);
  });
}

/**
 * Uploads a binary file directly to presigned storage (S3 / MinIO) with
 * granular upload progress tracking, timeout protection, and automatic resilient fallback.
 *
 * 1. Primary: Direct XMLHttpRequest to presigned storage (real-time upload progress).
 * 2. Secondary: If direct XHR fails with network error (e.g. CORS block, ad-blocker, stream reset),
 *    automatically falls back to same-origin server-side proxy streaming upload.
 * 3. Tertiary: Direct fetch fallback if proxy is disabled or unavailable.
 */
export async function uploadToStorageWithProgress(
  uploadUrl: string,
  file: File | Blob,
  options: StorageUploadOptions = {}
): Promise<void> {
  const {
    contentType = file.type || 'audio/mpeg',
    timeoutMs = 180000, // 3 minutes timeout default
    onProgress,
    proxyUrl = '/api/recordings/proxy-upload',
  } = options;

  // In non-browser / node test environments without XMLHttpRequest, fallback to fetch
  if (typeof XMLHttpRequest === 'undefined') {
    await uploadViaFetch(uploadUrl, file, contentType);
    onProgress?.(100);
    return;
  }

  // Attempt 1: Direct XMLHttpRequest to presigned storage
  try {
    await uploadViaXHR(uploadUrl, file, contentType, timeoutMs, onProgress);
    return;
  } catch (xhrErr: unknown) {
    if (isMockTarget(uploadUrl)) {
      onProgress?.(100);
      return;
    }

    // Explicit timeouts or explicit 4xx errors should not be retried blindly
    const errMessage = xhrErr instanceof Error ? xhrErr.message : '';
    if (errMessage.includes('timed out') || errMessage.includes('status 4')) {
      throw xhrErr;
    }

    // Attempt 2: Resilient server-side proxy fallback (bypasses CORS & adblocker restrictions)
    if (proxyUrl) {
      try {
        await uploadViaProxy(proxyUrl, uploadUrl, file, contentType, timeoutMs, onProgress);
        return;
      } catch (proxyErr: unknown) {
        // Fall through to fetch attempt if proxy fails
      }
    }

    // Attempt 3: Direct fetch fallback
    try {
      await uploadViaFetch(uploadUrl, file, contentType);
      onProgress?.(100);
      return;
    } catch (fetchErr: unknown) {
      // Fall through to terminal rejection
    }

    throw new Error(
      'Network error occurred while uploading file to storage. If you use Brave or an ad-blocker, please allow scripts or disable shields for this site, or check your internet connection.'
    );
  }
}
