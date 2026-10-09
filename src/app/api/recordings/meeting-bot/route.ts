import { meetingBotController } from '@/server/controllers/meeting-bot.controller';

export async function POST(req: Request) {
  return meetingBotController.dispatch(req);
}
