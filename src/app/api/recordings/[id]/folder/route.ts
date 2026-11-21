import { workspaceController } from '@/server/controllers/workspace.controller';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return workspaceController.moveRecordingFolder(req, id);
}

