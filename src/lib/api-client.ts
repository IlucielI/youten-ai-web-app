/**
 * Client-Side API Error.
 * Thrown when internal Next.js API or BFF route returns a non-2xx status code.
 */
export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Standard typed client fetcher for browser/client components.
 * Automatically injects headers, parses JSON, and transforms HTTP errors into typed ApiClientError.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Automatically attach guest ownership token if available in localStorage for this recording
  if (typeof window !== 'undefined' && !headers['x-ownership-token']) {
    try {
      const match = endpoint.match(/\/api\/recordings\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const recId = match[1];
        const reserved = ['presign', 'upload', 'import-url', 'search', 'ask', 'claim', 'shared'];
        if (!reserved.includes(recId)) {
          const raw = localStorage.getItem('youten_guest_tokens');
          if (raw) {
            const parsed = JSON.parse(raw);
            const tokens = parsed?.state?.guestTokens || [];
            const item = tokens.find((t: { id: string }) => t.id === recId);
            if (item?.ownership_token) {
              headers['x-ownership-token'] = item.ownership_token;
            }
          }
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorCode = typeof data === 'object' && data?.code ? String(data.code) : `HTTP_${response.status}`;
    const errorMessage =
      typeof data === 'object' && (data?.error || data?.message)
        ? String(data.error || data.message)
        : response.statusText || 'Request failed';
    const details = typeof data === 'object' && 'details' in data ? data.details : undefined;

    throw new ApiClientError(response.status, errorCode, errorMessage, details);
  }

  return data as T;
}

/**
 * Convenience helper to fetch and unwrap standard ApiResponse<T>.data envelope.
 */
export async function apiFetchData<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiFetch<{ data: T }>(endpoint, options);
  return response.data;
}
