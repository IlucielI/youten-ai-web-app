import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceService } from './workspace.service';
import { IWorkspaceRepository } from '../repositories/workspace.repository.interface';
import {
  SemanticSearchQuery,
  SemanticSearchResponse,
  WorkspaceAskRequest,
  WorkspaceAskResponse,
  SpeakerDirectoryResponse,
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let mockRepo: IWorkspaceRepository;

  beforeEach(() => {
    mockRepo = {
      semanticSearch: vi.fn(),
      askWorkspace: vi.fn(),
      getSpeakers: vi.fn(),
    };
    service = new WorkspaceService(mockRepo);
  });

  describe('semanticSearch', () => {
    it('delegates semantic search query to repository and returns envelope', async () => {
      const query: SemanticSearchQuery = { q: 'budget planning', limit: 5, threshold: 0.5 };
      const expectedResponse: ApiResponse<SemanticSearchResponse> = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Search completed',
        data: {
          query: 'budget planning',
          count: 1,
          results: [
            {
              recording_id: '11111111-1111-1111-1111-111111111111',
              recording_title: 'Finance Review',
              chunk_index: 0,
              snippet: 'Discussed Q4 marketing budget allocation.',
              start_time: 120,
              end_time: 180,
              score: 0.88,
            },
          ],
        },
        timestamp: new Date().toISOString(),
      };

      vi.mocked(mockRepo.semanticSearch).mockResolvedValue(expectedResponse);

      const result = await service.semanticSearch(query);

      expect(mockRepo.semanticSearch).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('askWorkspace', () => {
    it('delegates ask workspace request to repository and returns citations', async () => {
      const payload: WorkspaceAskRequest = { question: 'What was decided about the budget?' };
      const expectedResponse: ApiResponse<WorkspaceAskResponse> = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Answer generated',
        data: {
          answer: 'The budget was approved at $50k.',
          sources: [
            {
              recording_id: '11111111-1111-1111-1111-111111111111',
              recording_title: 'Finance Review',
              chunk_index: 0,
              snippet: 'Budget approved at $50k.',
              start_time: 150,
              end_time: 175,
            },
          ],
        },
        timestamp: new Date().toISOString(),
      };

      vi.mocked(mockRepo.askWorkspace).mockResolvedValue(expectedResponse);

      const result = await service.askWorkspace(payload);

      expect(mockRepo.askWorkspace).toHaveBeenCalledWith(payload);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSpeakers', () => {
    it('delegates getSpeakers call to repository', async () => {
      const expectedResponse: ApiResponse<SpeakerDirectoryResponse> = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Speakers fetched',
        data: {
          count: 2,
          speakers: [
            {
              name: 'Alice Johnson',
              total_meetings: 5,
              total_talk_time: 3600,
              last_active: '2026-10-06T12:00:00Z',
            },
          ],
        },
        timestamp: new Date().toISOString(),
      };

      vi.mocked(mockRepo.getSpeakers).mockResolvedValue(expectedResponse);

      const result = await service.getSpeakers();

      expect(mockRepo.getSpeakers).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });
});
