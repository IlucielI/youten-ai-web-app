import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IFeedbackService } from '../services/feedback.service.interface';
import { feedbackService as defaultFeedbackService } from '../services/feedback.service';
import { FeedbackRequestSchema } from '../schemas/feedback.schema';
import { MemoryRateLimiter } from '../utils/rate-limiter';
import { TooManyRequestsError } from '../errors/app.error';
import { ILogger } from '../logger/logger.interface';

export class FeedbackController extends BaseController {
  private readonly rateLimiter: MemoryRateLimiter;

  constructor(
    private readonly feedbackService: IFeedbackService = defaultFeedbackService,
    rateLimiter?: MemoryRateLimiter,
    logger?: ILogger
  ) {
    super(logger);
    // Default: max 5 feedback submissions per 10 minutes per client IP
    this.rateLimiter = rateLimiter ?? new MemoryRateLimiter(5, 10 * 60 * 1000);
  }

  async submit(req: Request): Promise<NextResponse> {
    return this.handle(
      req,
      async () => {
        // 1. Client IP rate limiting
        const clientIp = req.headers.get('x-client-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateCheck = this.rateLimiter.check(clientIp);
        if (!rateCheck.allowed) {
          throw new TooManyRequestsError(
            'Terlalu banyak permintaan feedback dari perangkat Anda. Silakan coba lagi nanti.',
            undefined,
            rateCheck.retryAfterSeconds
          );
        }

        // 2. Parse & Validate request body
        const body = await this.getBody(req, FeedbackRequestSchema);

        // 3. Fallback: extract Idempotency-Key from header if not present in body
        if (!body.idempotency_key) {
          const headerKey = req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key');
          if (headerKey && headerKey.trim() !== '') {
            body.idempotency_key = headerKey.trim();
          }
        }

        // 4. Delegate to feedback service
        return this.feedbackService.submitFeedback(body);
      },
      { status: 201 }
    );
  }
}

/**
 * Colocated singleton instance for FeedbackController.
 */
export const feedbackController = new FeedbackController();
