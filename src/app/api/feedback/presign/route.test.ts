import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { feedbackController } from '@/server/controllers/feedback.controller';
import { NextResponse } from 'next/server';

describe('POST /api/feedback/presign', () => {
  it('delegates to feedbackController.presignUpload', async () => {
    const spy = vi
      .spyOn(feedbackController, 'presignUpload')
      .mockResolvedValueOnce(
        NextResponse.json(
          {
            status: 'success',
            data: {
              upload_url: 'https://s3.example.com/recordings/feedbacks/uuid/test.png',
              object_key: 'feedbacks/uuid/test.png',
              filename: 'test.png',
              content_type: 'image/png',
            },
          },
          { status: 200 }
        )
      );

    const req = new Request('http://localhost:3000/api/feedback/presign', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'test.png',
        content_type: 'image/png',
        file_size_bytes: 1024,
      }),
    });
    const res = await POST(req);

    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.object_key).toBe('feedbacks/uuid/test.png');

    spy.mockRestore();
  });
});
