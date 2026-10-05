import { HttpClient } from './http.client';
import { IHttpClient } from './http.client.interface';
import { env } from '../../config';
import { logger } from '../../logger';

export * from './http.client.interface';
export * from './http.client';

export const httpClient: IHttpClient = new HttpClient({
  baseUrl: env.CORE_API_URL,
  logger: logger.forClass ? logger.forClass(HttpClient) : logger.child({ module: HttpClient.name }),
});
