import { meetingBotController } from '@/server/controllers/meeting-bot.controller';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return meetingBotController.getStatus(req, id);
}
