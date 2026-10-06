import { authController } from '@/server/controllers/auth.controller';

export async function PUT(req: Request) {
  return authController.changePassword(req);
}
