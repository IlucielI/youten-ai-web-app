import { authController } from '@/server/controllers/auth.controller';

export async function GET(req: Request) {
  return authController.getMe(req);
}
