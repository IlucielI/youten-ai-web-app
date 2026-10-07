import { recordingController } from '@/server/controllers/recording.controller';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  return recordingController.activateSummary(req, id, versionId);
}
