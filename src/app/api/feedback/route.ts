import { feedbackController } from '@/server/controllers/feedback.controller';

export async function POST(req: Request) {
  return feedbackController.submit(req);
}
