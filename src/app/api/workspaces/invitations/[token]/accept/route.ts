import { workspaceController } from '@/server/controllers/workspace.controller';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return workspaceController.acceptInvitation(req, token);
}

