import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackController } from './feedback.controller';
import { IFeedbackService } from '../services/feedback.service.interface';
import { FeedbackResponse } from '../dtos/feedback.dto';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';
import { MemoryRateLimiter } from '../utils/rate-limiter';

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let mockService: {
    submitFeedback: ReturnType<typeof vi.fn>;
  };
  let rateLimiter: MemoryRateLimiter;

  beforeEach(() => {
    mockService = {
      submitFeedback: vi.fn(),
    };
    rateLimiter = new MemoryRateLimiter(2, 60000); // 2 requests per minute for testing
    controller = new FeedbackController(
      mockService as unknown as IFeedbackService,
      rateLimiter
    );
  });

  describe('submit', () => {
    it('successfully processes valid feedback submission with 201 Created', async () => {
      const payload = {
        title: 'Export feature failed',
        category: 'bug',
        rating: 3,
        message: 'When clicking export as PDF, the loading spinner never stops.',
        user_name: 'John Doe',
        user_email: 'john@example.com',
        idempotency_key: 'idem-key-123',
      };

      const mockResult: ApiResponse<FeedbackResponse> = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Feedback submitted successfully',
        data: {
          id: 'b7a8a1c9-6d6f-4f27-8149-a61250cf16e9',
          title: payload.title,
          category: payload.category,
          rating: payload.rating,
          message: payload.message,
          status: 'new',
          user_name: payload.user_name,
          user_email: payload.user_email,
          idempotency_key: payload.idempotency_key,
          created_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      mockService.submitFeedback.mockResolvedValue(mockResult);

      const req = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-ip': '192.168.1.50',
        },
        body: JSON.stringify(payload),
      });

      const response = await controller.submit(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(mockService.submitFeedback).toHaveBeenCalledWith(expect.objectContaining({
        title: payload.title,
        message: payload.message,
        rating: 3,
      }));
      expect(json.data.id).toBe('b7a8a1c9-6d6f-4f27-8149-a61250cf16e9');
    });

    it('extracts Idempotency-Key from header when missing in body', async () => {
      const payload = {
        title: 'Great app!',
        message: 'The AI summarization accuracy is fantastic for my daily standups.',
      };

      mockService.submitFeedback.mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Feedback submitted successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: payload.title,
          category: 'general',
          rating: 5,
          message: payload.message,
          status: 'new',
          idempotency_key: 'header-idem-999',
          created_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      const req = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-ip': '10.0.0.1',
          'Idempotency-Key': 'header-idem-999',
        },
        body: JSON.stringify(payload),
      });

      const response = await controller.submit(req);
      expect(response.status).toBe(201);
      expect(mockService.submitFeedback).toHaveBeenCalledWith(expect.objectContaining({
        idempotency_key: 'header-idem-999',
      }));
    });

    it('returns 400 Bad Request when validation fails (short message)', async () => {
      const payload = {
        title: 'Title',
        message: 'Too short',
      };

      const req = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await controller.submit(req);
      expect(response.status).toBe(400);
      expect(mockService.submitFeedback).not.toHaveBeenCalled();
    });

    it('enforces rate limiting and returns 429 Too Many Requests with Retry-After header', async () => {
      const payload = {
        title: 'Valid Title',
        message: 'Valid length feedback message for testing rate limit.',
      };

      mockService.submitFeedback.mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'OK',
        timestamp: new Date().toISOString(),
      });

      const makeReq = () =>
        new Request('http://localhost/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-ip': '203.0.113.195',
          },
          body: JSON.stringify(payload),
        });

      // 1st request -> ok
      const res1 = await controller.submit(makeReq());
      expect(res1.status).toBe(201);

      // 2nd request -> ok
      const res2 = await controller.submit(makeReq());
      expect(res2.status).toBe(201);

      // 3rd request -> rate limited!
      const res3 = await controller.submit(makeReq());
      expect(res3.status).toBe(429);
      expect(res3.headers.get('Retry-After')).toBeDefined();
    });
  });
});
