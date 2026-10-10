import { templateController } from '@/server/controllers/template.controller';

export async function GET(req: Request) {
  return templateController.listTemplates(req);
}
