import { workspaceController } from '@/server/controllers/workspace.controller';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return workspaceController.listMembers(req, id);
}
