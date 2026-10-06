import { recordingController } from '@/server/controllers/recording.controller';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return recordingController.regenerateSummary(req, id);
}
