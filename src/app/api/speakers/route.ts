import { workspaceController } from '@/server/controllers/workspace.controller';

export async function GET(req: Request) {
  return workspaceController.speakers(req);
}
