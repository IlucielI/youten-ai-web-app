import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WaitlistService } from './waitlist.service';
import { IWaitlistRepository } from '../repositories/waitlist.repository.interface';
import { WaitlistRequest, WaitlistResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';
import { WaitlistStatus } from '../constants/recording.constant';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let mockRepo: {
    joinBotWaitlist: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      joinBotWaitlist: vi.fn(),
    };
    service = new WaitlistService(mockRepo as unknown as IWaitlistRepository);
  });

  it('delegates joinBotWaitlist to waitlistRepo', async () => {
    const payload: WaitlistRequest = {
      email: 'pilot@company.com',
      platform: 'discord',
      company_size: '1-10',
    };
    const expectedResponse: ApiResponse<WaitlistResponse> = {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Successfully joined meeting voice bot beta waitlist',
      data: {
        email: 'pilot@company.com',
        platform: 'discord',
        company_size: '1-10',
        status: WaitlistStatus.PENDING,
        message: 'Successfully joined meeting voice bot beta waitlist',
      },
      timestamp: new Date().toISOString(),
    };

    mockRepo.joinBotWaitlist.mockResolvedValue(expectedResponse);

    const result = await service.joinBotWaitlist(payload);

    expect(mockRepo.joinBotWaitlist).toHaveBeenCalledWith(payload);
    expect(result).toEqual(expectedResponse);
  });
});
