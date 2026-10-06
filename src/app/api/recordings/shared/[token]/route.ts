import { recordingController } from '@/server/controllers/recording.controller';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return recordingController.getShared(req, token);
}
