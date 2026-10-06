import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WaitlistController } from './waitlist.controller';
import { IWaitlistService } from '../services/waitlist.service.interface';
import { WaitlistResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';
import { WaitlistStatus } from '../constants/recording.constant';

describe('WaitlistController', () => {
  let controller: WaitlistController;
  let mockService: {
    joinBotWaitlist: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockService = {
      joinBotWaitlist: vi.fn(),
    };
    controller = new WaitlistController(mockService as unknown as IWaitlistService);
  });

  describe('join', () => {
    it('successfully processes valid waitlist request', async () => {
      const payload = {
        email: 'founder@startup.io',
        platform: 'google_meet',
        company_size: '1-10',
      };
      const mockResult: ApiResponse<WaitlistResponse> = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Successfully joined meeting voice bot beta waitlist',
        data: {
          email: 'founder@startup.io',
          platform: 'google_meet',
          company_size: '1-10',
          status: WaitlistStatus.PENDING,
          message: 'Successfully joined meeting voice bot beta waitlist',
        },
        timestamp: new Date().toISOString(),
      };

      mockService.joinBotWaitlist.mockResolvedValue(mockResult);

      const req = new Request('http://localhost/api/waitlist/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await controller.join(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(mockService.joinBotWaitlist).toHaveBeenCalledWith(payload);
      expect(json.data.email).toBe('founder@startup.io');
    });

    it('returns 400 Bad Request when email is invalid', async () => {
      const req = new Request('http://localhost/api/waitlist/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });

      const response = await controller.join(req);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.code).toBe(ResponseCode.BAD_REQUEST);
      expect(mockService.joinBotWaitlist).not.toHaveBeenCalled();
    });
  });
});
