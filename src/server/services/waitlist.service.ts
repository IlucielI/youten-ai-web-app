import { IWaitlistService } from './waitlist.service.interface';
import {
  IWaitlistRepository,
  waitlistRepository as defaultWaitlistRepo,
} from '../repositories';
import { WaitlistRequest, WaitlistResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export class WaitlistService implements IWaitlistService {
  private readonly waitlistRepo: IWaitlistRepository;

  constructor(waitlistRepo: IWaitlistRepository = defaultWaitlistRepo) {
    this.waitlistRepo = waitlistRepo;
  }

  async joinBotWaitlist(payload: WaitlistRequest): Promise<ApiResponse<WaitlistResponse>> {
    return this.waitlistRepo.joinBotWaitlist(payload);
  }
}

/**
 * Colocated singleton instance for WaitlistService.
 */
export const waitlistService: IWaitlistService = new WaitlistService();
