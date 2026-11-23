import { calendarController } from '@/server/controllers/calendar.controller';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return calendarController.toggleEventAutoRecord(req, id);
}

