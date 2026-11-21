import { workspaceController } from '@/server/controllers/workspace.controller';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return workspaceController.listInvitations(req, id);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return workspaceController.createInvitation(req, id);
}

