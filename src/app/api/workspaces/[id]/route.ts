import { workspaceController } from '@/server/controllers/workspace.controller';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return workspaceController.getWorkspace(req, id);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return workspaceController.updateWorkspace(req, id);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return workspaceController.deleteWorkspace(req, id);
}
