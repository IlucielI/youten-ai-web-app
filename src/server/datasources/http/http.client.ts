import { headers as getNextHeaders, cookies as getNextCookies } from 'next/headers';
import { ILogger } from '../../logger/logger.interface';
import { REQUEST_ID_HEADER } from '../../context/request.context';
import {
  AUTH_COOKIE_NAME,
  GUEST_COOKIE_NAME,
  ANON_TOKEN_HEADER,
  OWNERSHIP_TOKEN_HEADER,
  FORWARDED_FOR_HEADER,
  REAL_IP_HEADER,
  CLIENT_IP_HEADER,
} from '../../constants/auth.constant';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BadGatewayError,
  GatewayTimeoutError,
} from '../../errors/app.error';
import {
  IHttpClient,
  HttpRequestOptions,
} from './http.client.interface';

export interface HttpClientConfig {
  baseUrl?: string;
  defaultTimeoutMs?: number;
  defaultHeaders?: Record<string, string>;
  logger?: ILogger;
  autoForwardSession?: boolean;
}

/**
 * Enterprise HTTP Client DataSource for Upstream Core API integration.
 * 
 * Guarantees:
 * 1. Automatic base URL resolution and query parameter serialization.
 * 2. Automatic Correlation ID (x-request-id) propagation.
 * 3. Automatic HTTP-only auth cookie resolution (Authorization: Bearer <token>).
 * 4. Automatic client IP forwarding (X-Forwarded-For & X-Real-IP) to prevent guest IP pooling.
 * 5. Automatic guest ownership token forwarding (X-Ownership-Token).
 * 6. Request timeout protection via AbortController.
 * 7. Automatic mapping of HTTP error statuses to Clean Architecture AppErrors.
 * 8. Optional runtime Zod schema validation and Anti-Corruption Layer (ACL) mapping.
 */
export class HttpClient implements IHttpClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly logger?: ILogger;
  private readonly autoForwardSession: boolean;

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = (config.baseUrl || '').replace(/\/$/, '');
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 5000;
    this.defaultHeaders = config.defaultHeaders || {};
    this.logger = config.logger;
    this.autoForwardSession = config.autoForwardSession ?? true;
  }

  async get<T = unknown>(path: string, options?: HttpRequestOptions<T>): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T = unknown>(path: string, body?: unknown, options?: HttpRequestOptions<T>): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  async put<T = unknown>(path: string, body?: unknown, options?: HttpRequestOptions<T>): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  async patch<T = unknown>(path: string, body?: unknown, options?: HttpRequestOptions<T>): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  async delete<T = unknown>(path: string, options?: HttpRequestOptions<T>): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: HttpRequestOptions<T>
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...options?.headers,
    };

    // 1. Session token resolution:
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    } else if (this.autoForwardSession && !headers['Authorization'] && !headers['authorization']) {
      try {
        const cookieStore = await getNextCookies();
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          // If no user auth token, check for guest session token
          const guestToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;
          if (guestToken) {
            headers['Authorization'] = `Bearer ${guestToken}`;
            if (!headers[ANON_TOKEN_HEADER]) {
              headers[ANON_TOKEN_HEADER] = guestToken;
            }
          }
        }
      } catch {
        // Outside Next.js request context (tests, background jobs)
      }
    }

    // 2. Explicit anonymous token resolution:
    if (options?.anonToken) {
      headers[ANON_TOKEN_HEADER] = options.anonToken;
    }

    // 3. Explicit client IP resolution:
    if (options?.clientIp) {
      headers[FORWARDED_FOR_HEADER] = options.clientIp;
      headers[REAL_IP_HEADER] = options.clientIp;
    }

    // 4. Explicit guest ownership token resolution:
    if (options?.ownershipToken) {
      headers[OWNERSHIP_TOKEN_HEADER] = options.ownershipToken;
    }

    // 4. Explicit request ID resolution:
    if (options?.requestId) {
      headers[REQUEST_ID_HEADER] = options.requestId;
    }

    // 5. Automatic header forwarding from Next.js incoming request context:
    if (this.autoForwardSession) {
      try {
        const incomingHeaders = await getNextHeaders();

        if (!headers[REQUEST_ID_HEADER]) {
          const incomingRequestId = incomingHeaders.get(REQUEST_ID_HEADER);
          if (incomingRequestId) {
            headers[REQUEST_ID_HEADER] = incomingRequestId;
          }
        }

        if (!headers[FORWARDED_FOR_HEADER] && !headers[REAL_IP_HEADER]) {
          const clientIp =
            incomingHeaders.get(CLIENT_IP_HEADER) ||
            incomingHeaders.get(FORWARDED_FOR_HEADER) ||
            incomingHeaders.get(REAL_IP_HEADER);
          if (clientIp) {
            headers[FORWARDED_FOR_HEADER] = clientIp;
            headers[REAL_IP_HEADER] = clientIp;
          }
        }

        if (!headers[OWNERSHIP_TOKEN_HEADER]) {
          const guestToken = incomingHeaders.get(OWNERSHIP_TOKEN_HEADER);
          if (guestToken) {
            headers[OWNERSHIP_TOKEN_HEADER] = guestToken;
          }
        }

        if (!headers[ANON_TOKEN_HEADER]) {
          const incomingAnonToken = incomingHeaders.get(ANON_TOKEN_HEADER);
          if (incomingAnonToken) {
            headers[ANON_TOKEN_HEADER] = incomingAnonToken;
          }
        }
      } catch {
        // Outside Next.js request context
      }
    }

    if (body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
      cache: options?.cache,
      ...(options?.next ? { next: options.next } : {}),
    };

    if (body !== undefined) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        await this.handleHttpError(response, url, method);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const rawJson = await response.json();

      if (options?.schema) {
        const parsed = options.schema.safeParse(rawJson);
        if (!parsed.success) {
          const errorDetails = parsed.error.flatten();
          this.logger?.error('Upstream Core API contract validation failed', {
            url,
            method,
            errors: errorDetails,
          });
          throw new BadGatewayError('Upstream API contract violation', errorDetails);
        }
        return parsed.data;
      }

      return rawJson as T;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger?.warn('Upstream Core API request timed out', { url, method, timeoutMs });
        throw new GatewayTimeoutError(`Upstream API request timed out after ${timeoutMs}ms`);
      }

      // Re-throw already mapped AppErrors
      if (error instanceof BadRequestError ||
          error instanceof UnauthorizedError ||
          error instanceof ForbiddenError ||
          error instanceof NotFoundError ||
          error instanceof ConflictError ||
          error instanceof BadGatewayError ||
          error instanceof GatewayTimeoutError) {
        throw error;
      }

      this.logger?.error('Upstream Core API request network failure', {
        url,
        method,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new BadGatewayError(
        `Failed to communicate with upstream service: ${error instanceof Error ? error.message : 'Network error'}`
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    let fullUrl = path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    return fullUrl;
  }

  private async handleHttpError(response: Response, url: string, method: string): Promise<never> {
    let errorPayload: unknown;
    let message = `Upstream HTTP ${response.status}`;

    try {
      errorPayload = await response.json();
      if (typeof errorPayload === 'object' && errorPayload !== null) {
        const payloadObj = errorPayload as Record<string, unknown>;
        if (typeof payloadObj.message === 'string') {
          message = payloadObj.message;
        } else if (typeof payloadObj.error === 'string') {
          message = payloadObj.error;
        }
      }
    } catch {
      try {
        const text = await response.text();
        if (text) message = text.slice(0, 200);
      } catch {
        // ignore
      }
    }

    this.logger?.warn('Upstream Core API returned error response', {
      url,
      method,
      status: response.status,
      errorPayload,
    });

    switch (response.status) {
      case 400:
        throw new BadRequestError(message, errorPayload);
      case 401:
        throw new UnauthorizedError(message, errorPayload);
      case 403:
        throw new ForbiddenError(message, errorPayload);
      case 404:
        throw new NotFoundError(message, errorPayload);
      case 409:
        throw new ConflictError(message, errorPayload);
      case 504:
        throw new GatewayTimeoutError(message, errorPayload);
      default:
        throw new BadGatewayError(message, errorPayload);
    }
  }
}
