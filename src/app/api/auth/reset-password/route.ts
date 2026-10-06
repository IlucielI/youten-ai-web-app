import { authController } from '@/server/controllers/auth.controller';

export async function POST(req: Request) {
  return authController.resetPassword(req);
}
