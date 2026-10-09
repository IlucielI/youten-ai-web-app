import { describe, it, expect, vi } from 'vitest';
import { MeetingBotController } from './meeting-bot.controller';
import { IMeetingBotService } from '../services';
import { ResponseStatus, ResponseCode } from '../constants';

describe('MeetingBotController', () => {
  const mockService: IMeetingBotService = {
    getCapabilities: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Capabilities retrieved',
      data: {
        meeting_bot: {
          discord: 'available',
          google_meet: 'available',
          ms_teams: 'available',
          zoom: 'available',
        },
      },
      timestamp: '2026-10-10T04:00:00Z',
    }),
    dispatch: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Bot dispatched',
      data: {
        recording_id: 'rec-123',
        session_id: 'sess-123',
        provider: 'google_meet',
        status: 'DISPATCHED',
        meeting_url: 'https://meet.google.com/abc-defg-hij',
        message: 'Bot dispatched',
      },
      timestamp: '2026-10-10T04:00:00Z',
    }),
    getStatus: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Status retrieved',
      data: {
        session_id: 'sess-123',
        recording_id: 'rec-123',
        provider: 'google_meet',
        status: 'RECORDING',
      },
      timestamp: '2026-10-10T04:00:00Z',
    }),
    stop: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Stop dispatched',
      data: {
        session_id: 'sess-123',
        recording_id: 'rec-123',
        status: 'COMPLETED',
        message: 'Stop dispatched',
      },
      timestamp: '2026-10-10T04:00:00Z',
    }),
  };

  const controller = new MeetingBotController(mockService);

  it('handles getCapabilities returning 200 with capabilities', async () => {
    const req = new Request('http://localhost:3000/api/capabilities', { method: 'GET' });
    const res = await controller.getCapabilities(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.meeting_bot.discord).toBe('available');
  });

  it('handles dispatch returning 201 with session info', async () => {
    const req = new Request('http://localhost:3000/api/recordings/meeting-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google_meet',
        meeting_url: 'https://meet.google.com/abc-defg-hij',
      }),
    });
    const res = await controller.dispatch(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.session_id).toBe('sess-123');
  });

  it('handles getStatus returning 200 with status info', async () => {
    const req = new Request('http://localhost:3000/api/recordings/meeting-bot/sess-123/status', { method: 'GET' });
    const res = await controller.getStatus(req, 'sess-123');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('RECORDING');
  });

  it('handles stop returning 200 with completed status', async () => {
    const req = new Request('http://localhost:3000/api/recordings/meeting-bot/sess-123/stop', { method: 'POST' });
    const res = await controller.stop(req, 'sess-123');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('COMPLETED');
  });
});
