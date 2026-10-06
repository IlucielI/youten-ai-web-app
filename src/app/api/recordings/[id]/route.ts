import { recordingController } from '@/server/controllers/recording.controller';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return recordingController.getDetail(req, id);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return recordingController.delete(req, id);
}
