import { workspaceController } from '@/server/controllers/workspace.controller';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return workspaceController.getChatSessionHistory(req, id);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return workspaceController.deleteChatSession(req, id);
}

