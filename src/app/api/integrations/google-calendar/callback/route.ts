import { calendarController } from '@/server/controllers/calendar.controller';

export async function POST(req: Request) {
  return calendarController.handleCallback(req);
}

