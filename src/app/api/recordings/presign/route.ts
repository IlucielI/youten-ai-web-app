import { recordingController } from '@/server/controllers/recording.controller';

export async function POST(req: Request) {
  return recordingController.presign(req);
}
