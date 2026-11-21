import { workspaceController } from '@/server/controllers/workspace.controller';

export async function GET(req: Request) {
  return workspaceController.listFolders(req);
}

export async function POST(req: Request) {
  return workspaceController.createFolder(req);
}

