import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import {
  IMeetingBotService,
  meetingBotService as defaultMeetingBotService,
} from '../services';
import { DispatchMeetingBotRequestSchema } from '../schemas';

export class MeetingBotController extends BaseController {
  private readonly service: IMeetingBotService;

  constructor(service: IMeetingBotService = defaultMeetingBotService) {
    super();
    this.service = service;
  }

  async getCapabilities(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.service.getCapabilities();
    });
  }

  async dispatch(req: Request): Promise<NextResponse> {
    return this.handle(
      req,
      async () => {
        const body = await this.getBody(req, DispatchMeetingBotRequestSchema);
        return this.service.dispatch(body);
      },
      { status: 201 }
    );
  }

  async getStatus(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.service.getStatus(id);
    });
  }

  async stop(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.service.stop(id);
    });
  }
}

/**
 * Colocated singleton instance for MeetingBotController.
 */
export const meetingBotController = new MeetingBotController();
