import { describe, it, expect, vi } from 'vitest';
import { MeetingBotService } from './meeting-bot.service';
import { IMeetingBotRepository } from '../repositories';
import { BotProvider } from '../constants/recording.constant';
import { ResponseStatus, ResponseCode } from '../constants';

describe('MeetingBotService', () => {
  const mockRepo: IMeetingBotRepository = {
    getCapabilities: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Capabilities retrieved successfully',
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
      message: 'Bot dispatched successfully',
      data: {
        recording_id: 'rec-123',
        session_id: 'sess-123',
        provider: 'google_meet',
        status: 'DISPATCHED',
        meeting_url: 'https://meet.google.com/abc-defg-hij',
        message: 'Bot dispatched successfully',
      },
      timestamp: '2026-10-10T04:00:00Z',
    }),
    getStatus: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Bot status retrieved',
      data: {
        session_id: 'sess-123',
        recording_id: 'rec-123',
        provider: 'google_meet',
        status: 'RECORDING',
        meeting_url: 'https://meet.google.com/abc-defg-hij',
      },
      timestamp: '2026-10-10T04:00:00Z',
    }),
    stop: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Bot leave command dispatched',
      data: {
        session_id: 'sess-123',
        recording_id: 'rec-123',
        status: 'COMPLETED',
        message: 'Bot leave command dispatched successfully',
      },
      timestamp: '2026-10-10T04:00:00Z',
    }),
  };

  const service = new MeetingBotService(mockRepo);

  it('delegates getCapabilities to repository', async () => {
    const res = await service.getCapabilities();
    expect(mockRepo.getCapabilities).toHaveBeenCalledTimes(1);
    expect(res.data!.meeting_bot.google_meet).toBe('available');
  });

  it('delegates dispatch to repository', async () => {
    const payload = {
      provider: BotProvider.GOOGLE_MEET,
      meeting_url: 'https://meet.google.com/abc-defg-hij',
    };
    const res = await service.dispatch(payload);
    expect(mockRepo.dispatch).toHaveBeenCalledWith(payload);
    expect(res.data!.session_id).toBe('sess-123');
  });

  it('delegates getStatus to repository', async () => {
    const res = await service.getStatus('sess-123');
    expect(mockRepo.getStatus).toHaveBeenCalledWith('sess-123');
    expect(res.data!.status).toBe('RECORDING');
  });

  it('delegates stop to repository', async () => {
    const res = await service.stop('sess-123');
    expect(mockRepo.stop).toHaveBeenCalledWith('sess-123');
    expect(res.data!.status).toBe('COMPLETED');
  });
});
