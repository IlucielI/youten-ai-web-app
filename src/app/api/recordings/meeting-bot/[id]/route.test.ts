import { describe, it, expect, vi } from 'vitest';
import { GET as getStatus } from './status/route';
import { POST as stopBot } from './stop/route';
import { meetingBotController } from '@/server/controllers/meeting-bot.controller';
import { NextResponse } from 'next/server';

describe('Meeting Bot Dynamic [id] routes', () => {
  it('GET /api/recordings/meeting-bot/[id]/status delegates to controller.getStatus', async () => {
    const spy = vi
      .spyOn(meetingBotController, 'getStatus')
      .mockResolvedValueOnce(NextResponse.json({ status: 'success', data: { status: 'RECORDING' } }));

    const req = new Request('http://localhost:3000/api/recordings/meeting-bot/sess-123/status', { method: 'GET' });
    const res = await getStatus(req, { params: Promise.resolve({ id: 'sess-123' }) });

    expect(spy).toHaveBeenCalledWith(req, 'sess-123');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('RECORDING');

    spy.mockRestore();
  });

  it('POST /api/recordings/meeting-bot/[id]/stop delegates to controller.stop', async () => {
    const spy = vi
      .spyOn(meetingBotController, 'stop')
      .mockResolvedValueOnce(NextResponse.json({ status: 'success', data: { status: 'COMPLETED' } }));

    const req = new Request('http://localhost:3000/api/recordings/meeting-bot/sess-123/stop', { method: 'POST' });
    const res = await stopBot(req, { params: Promise.resolve({ id: 'sess-123' }) });

    expect(spy).toHaveBeenCalledWith(req, 'sess-123');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('COMPLETED');

    spy.mockRestore();
  });
});
