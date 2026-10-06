import { waitlistController } from '@/server/controllers/waitlist.controller';

export async function POST(req: Request) {
  return waitlistController.join(req);
}
