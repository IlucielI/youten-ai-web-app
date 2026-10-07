import { recordingController } from '@/server/controllers/recording.controller';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; segmentId: string }> }
) {
  const { id, segmentId } = await params;
  return recordingController.updateSegment(req, id, segmentId);
}
