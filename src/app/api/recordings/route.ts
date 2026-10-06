import { recordingController } from '@/server/controllers/recording.controller';

export async function GET(req: Request) {
  return recordingController.list(req);
}
