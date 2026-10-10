import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateController } from './template.controller';
import { ITemplateService } from '../services/template.service.interface';
import { TemplateListResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

describe('TemplateController', () => {
  let controller: TemplateController;
  let mockService: {
    listTemplates: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockService = {
      listTemplates: vi.fn(),
    };
    controller = new TemplateController(mockService as unknown as ITemplateService);
  });

  describe('listTemplates', () => {
    it('successfully returns list of templates', async () => {
      const mockResult: ApiResponse<TemplateListResponse> = {
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

      mockService.listTemplates.mockResolvedValue(mockResult);

      const req = new Request('http://localhost/api/templates', {
        method: 'GET',
      });

      const response = await controller.listTemplates(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBe(ResponseStatus.SUCCESS);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].category_key).toBe('MOM');
    });

    it('handles service errors gracefully', async () => {
      mockService.listTemplates.mockRejectedValue(new Error('Core API network timeout'));

      const req = new Request('http://localhost/api/templates', {
        method: 'GET',
      });

      const response = await controller.listTemplates(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.code).toBe('INTERNAL_SERVER_ERROR');
      expect(json.error).toBeDefined();
    });
  });
});
