import { workspaceController } from '@/server/controllers/workspace.controller';

export async function GET(req: Request) {
  return workspaceController.listWorkspaces(req);
}

export async function POST(req: Request) {
  return workspaceController.createWorkspace(req);
}

