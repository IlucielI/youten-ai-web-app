import { workspaceController } from '@/server/controllers/workspace.controller';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  return workspaceController.updateMemberRole(req, id, userId);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  return workspaceController.removeMember(req, id, userId);
}
