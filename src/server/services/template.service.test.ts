import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateService } from './template.service';
import { ITemplateRepository } from '../repositories/template.repository.interface';
import { TemplateListResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

describe('TemplateService', () => {
  let service: TemplateService;
  let mockRepo: {
    listTemplates: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      listTemplates: vi.fn(),
    };
    service = new TemplateService(mockRepo as unknown as ITemplateRepository);
  });

  it('delegates listTemplates to templateRepo', async () => {
    const expectedResponse: ApiResponse<TemplateListResponse> = {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Templates retrieved successfully',
      data: {
        items: [
          {
            id: '1866eb24-298a-494b-a8e0-ed5f7680f2ae',
            category_key: 'MOM',
            name: 'Minutes of Meeting (MOM)',
            description: 'Ekstraksi agenda...',
            is_active: true,
          },
        ],
      },
      timestamp: new Date().toISOString(),
    };

    mockRepo.listTemplates.mockResolvedValue(expectedResponse);

    const result = await service.listTemplates();

    expect(mockRepo.listTemplates).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResponse);
    expect(result.data?.items).toHaveLength(1);
    expect(result.data?.items[0].category_key).toBe('MOM');
  });
});
