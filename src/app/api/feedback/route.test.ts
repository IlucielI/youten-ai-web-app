import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { feedbackController } from '@/server/controllers/feedback.controller';
import { NextResponse } from 'next/server';

describe('POST /api/feedback', () => {
  it('delegates to feedbackController.submit', async () => {
    const spy = vi
      .spyOn(feedbackController, 'submit')
      .mockResolvedValueOnce(
        NextResponse.json({ status: 'success', data: { id: 'fb-123', title: 'Test' } }, { status: 201 })
      );

    const req = new Request('http://localhost:3000/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Bagus sekali',
        category: 'praise',
        rating: 5,
        message: 'Aplikasi ini sangat membantu transkripsi kami.',
      }),
    });
    const res = await POST(req);

    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe('fb-123');

    spy.mockRestore();
  });
});
