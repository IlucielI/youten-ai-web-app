import { IWaitlistRepository } from './waitlist.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
import { WaitlistRequest, WaitlistResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

export class WaitlistRepository implements IWaitlistRepository {
  private readonly http: IHttpClient;
  private readonly mock: MockDataService;
  private readonly useMock: boolean;

  constructor(
    http: IHttpClient = defaultHttpClient,
    mock: MockDataService = defaultMockDataService,
    useMock: boolean = env.MOCK_CORE_API || env.USE_MOCK_DATA
  ) {
    this.http = http;
    this.mock = mock;
    this.useMock = useMock;
  }

  async joinBotWaitlist(payload: WaitlistRequest): Promise<ApiResponse<WaitlistResponse>> {
    if (this.useMock) {
      const data = this.mock.joinBotWaitlist(payload);
      return this.successResponse(data, 'Successfully joined meeting voice bot beta waitlist');
    }
    return this.http.post<ApiResponse<WaitlistResponse>>('/v1/waitlist/bot', payload);
  }

  private successResponse<T>(data: T, message: string): ApiResponse<T> {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Colocated singleton instance for WaitlistRepository.
 */
export const waitlistRepository: IWaitlistRepository = new WaitlistRepository();
