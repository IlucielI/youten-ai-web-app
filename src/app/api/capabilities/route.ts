import { meetingBotController } from '@/server/controllers/meeting-bot.controller';

export async function GET(req: Request) {
  return meetingBotController.getCapabilities(req);
}
