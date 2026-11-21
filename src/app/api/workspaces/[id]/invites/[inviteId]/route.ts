import { workspaceController } from '@/server/controllers/workspace.controller';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  const { id, inviteId } = await params;
  return workspaceController.revokeInvitation(req, id, inviteId);
}
