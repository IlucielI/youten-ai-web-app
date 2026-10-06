import { workspaceController } from '@/server/controllers/workspace.controller';

export async function POST(req: Request) {
  return workspaceController.ask(req);
}
