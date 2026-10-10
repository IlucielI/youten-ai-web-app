import { ITemplateRepository } from './template.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
import { TemplateListResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

export class TemplateRepository implements ITemplateRepository {
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

  private successResponse<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  async listTemplates(): Promise<ApiResponse<TemplateListResponse>> {
    if (this.useMock) {
      const data = this.mock.listTemplates();
      return this.successResponse(data, 'Templates retrieved successfully');
    }
    return this.http.get<ApiResponse<TemplateListResponse>>('/v1/templates');
  }
}

/**
 * Colocated singleton instance for TemplateRepository.
 */
export const templateRepository = new TemplateRepository();
