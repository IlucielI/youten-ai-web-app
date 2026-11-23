import { calendarController } from '@/server/controllers/calendar.controller';

export async function GET(req: Request) {
  return calendarController.getAuthURL(req);
}

