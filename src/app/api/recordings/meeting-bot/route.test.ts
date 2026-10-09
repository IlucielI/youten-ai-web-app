import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { meetingBotController } from '@/server/controllers/meeting-bot.controller';
import { NextResponse } from 'next/server';

describe('POST /api/recordings/meeting-bot', () => {
  it('delegates to meetingBotController.dispatch', async () => {
    const spy = vi
      .spyOn(meetingBotController, 'dispatch')
      .mockResolvedValueOnce(
        NextResponse.json({ status: 'success', data: { session_id: 'sess-123' } }, { status: 201 })
      );

    const req = new Request('http://localhost:3000/api/recordings/meeting-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google_meet',
        meeting_url: 'https://meet.google.com/abc-defg-hij',
      }),
    });
    const res = await POST(req);

    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.session_id).toBe('sess-123');

    spy.mockRestore();
  });
});
