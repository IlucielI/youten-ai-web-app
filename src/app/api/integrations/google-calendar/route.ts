import { calendarController } from '@/server/controllers/calendar.controller';

export async function DELETE(req: Request) {
  return calendarController.disconnect(req);
}

