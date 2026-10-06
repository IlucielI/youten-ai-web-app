import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IWaitlistService } from '../services/waitlist.service.interface';
import { waitlistService as defaultWaitlistService } from '../services/waitlist.service';
import { WaitlistRequestSchema } from '../schemas/waitlist.schema';
import { ILogger } from '../logger/logger.interface';

export class WaitlistController extends BaseController {
  constructor(
    private readonly waitlistService: IWaitlistService = defaultWaitlistService,
    logger?: ILogger
  ) {
    super(logger);
  }

  async join(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, WaitlistRequestSchema);
      return this.waitlistService.joinBotWaitlist(body);
    });
  }
}

/**
 * Colocated singleton instance for WaitlistController.
 */
export const waitlistController = new WaitlistController();
