import { workspaceController } from '@/server/controllers/workspace.controller';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return workspaceController.getInvitationByToken(req, token);
}

