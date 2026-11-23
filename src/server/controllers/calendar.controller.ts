import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { ICalendarService } from '../services/calendar.service.interface';
import { calendarService as defaultCalendarService } from '../services/calendar.service';
import {
  GoogleCalendarCallbackSchema,
  UpdateCalendarSettingsSchema,
  ToggleEventAutoRecordSchema,
  ListCalendarEventsQuerySchema,
} from '../schemas/calendar.schema';
import { ILogger } from '../logger/logger.interface';

export class CalendarController extends BaseController {
  constructor(
    private readonly calendarService: ICalendarService = defaultCalendarService,
    logger?: ILogger
  ) {
    super(logger);
  }

  async getAuthURL(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.calendarService.getAuthURL();
    });
  }

  async handleCallback(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, GoogleCalendarCallbackSchema);
      return this.calendarService.handleCallback(body);
    });
  }

  async getStatus(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.calendarService.getStatus();
    });
  }

  async updateSettings(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, UpdateCalendarSettingsSchema);
      return this.calendarService.updateSettings(body);
    });
  }

  async syncCalendar(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.calendarService.syncCalendar();
    });
  }

  async disconnect(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.calendarService.disconnect();
    });
  }

  async listEvents(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const query = this.getQuery(req, ListCalendarEventsQuerySchema);
      return this.calendarService.listEvents(query);
    });
  }

  async toggleEventAutoRecord(req: Request, eventId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, ToggleEventAutoRecordSchema);
      return this.calendarService.toggleEventAutoRecord(eventId, body);
    });
  }
}

export const calendarController = new CalendarController();

