import { recordingController } from '@/server/controllers/recording.controller';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return recordingController.toggleShare(req, id);
}
