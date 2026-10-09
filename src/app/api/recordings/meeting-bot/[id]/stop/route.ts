import { meetingBotController } from '@/server/controllers/meeting-bot.controller';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return meetingBotController.stop(req, id);
}
