import { calendarController } from '@/server/controllers/calendar.controller';

export async function PATCH(req: Request) {
  return calendarController.updateSettings(req);
}

