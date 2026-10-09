import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { meetingBotController } from '@/server/controllers/meeting-bot.controller';
import { NextResponse } from 'next/server';

describe('GET /api/capabilities', () => {
  it('delegates to meetingBotController.getCapabilities', async () => {
    const spy = vi
      .spyOn(meetingBotController, 'getCapabilities')
      .mockResolvedValueOnce(NextResponse.json({ status: 'success', data: { meeting_bot: { discord: 'available' } } }));

    const req = new Request('http://localhost:3000/api/capabilities', { method: 'GET' });
    const res = await GET(req);

    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.meeting_bot.discord).toBe('available');

    spy.mockRestore();
  });
});
