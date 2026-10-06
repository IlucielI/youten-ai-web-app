import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceController } from './workspace.controller';
import { IWorkspaceService } from '../services/workspace.service.interface';
import { ApiResponse } from '../dtos/response.dto';
import {
  SemanticSearchResponse,
  WorkspaceAskResponse,
  SpeakerDirectoryResponse,
} from '../dtos';
import { ResponseStatus, ResponseCode } from '../constants';

describe('WorkspaceController', () => {
  let controller: WorkspaceController;
  let mockService: IWorkspaceService;

  beforeEach(() => {
    mockService = {
      semanticSearch: vi.fn(),
      askWorkspace: vi.fn(),
      getSpeakers: vi.fn(),
    };
    controller = new WorkspaceController(mockService);
  });

  describe('search', () => {
    it('handles valid search query and returns search results', async () => {
      const mockResult: ApiResponse<SemanticSearchResponse> = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Search completed',
        data: {
          query: 'architecture',
          count: 1,
          results: [
            {
              recording_id: '11111111-1111-1111-1111-111111111111',
              recording_title: 'System Architecture Review',
              chunk_index: 0,
              snippet: 'Microservices vs Monolith debate',
              start_time: 10,
              end_time: 50,
              score: 0.95,
            },
          ],
        },
        timestamp: new Date().toISOString(),
      };

      vi.mocked(mockService.semanticSearch).mockResolvedValue(mockResult);

      const req = new Request('http://localhost:3000/api/recordings/search?q=architecture&limit=10&threshold=0.5');
      const res = await controller.search(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.status).toBe('success');
      expect(json.data.results).toHaveLength(1);
      expect(mockService.semanticSearch).toHaveBeenCalledWith({
        q: 'architecture',
        limit: 10,
        threshold: 0.5,
      });
    });

    it('returns validation error when search query is empty', async () => {
      const req = new Request('http://localhost:3000/api/recordings/search?q=');
      const res = await controller.search(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe(ResponseCode.BAD_REQUEST);
      expect(mockService.semanticSearch).not.toHaveBeenCalled();
    });
  });

  describe('ask', () => {
    it('handles valid workspace ask request and returns AI answer with citations', async () => {
      const mockResult: ApiResponse<WorkspaceAskResponse> = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Processed',
        data: {
          answer: 'The system uses clean architecture.',
          sources: [
            {
              recording_id: '11111111-1111-1111-1111-111111111111',
              recording_title: 'System Architecture Review',
              chunk_index: 0,
              snippet: 'The system uses clean architecture.',
              start_time: 12,
              end_time: 30,
            },
          ],
        },
        timestamp: new Date().toISOString(),
      };

      vi.mocked(mockService.askWorkspace).mockResolvedValue(mockResult);

      const req = new Request('http://localhost:3000/api/recordings/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'What architecture does the system use?' }),
      });

      const res = await controller.ask(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.answer).toBe('The system uses clean architecture.');
      expect(json.data.sources).toHaveLength(1);
      expect(mockService.askWorkspace).toHaveBeenCalledWith({
        question: 'What architecture does the system use?',
      });
    });

    it('returns validation error when question is empty', async () => {
      const req = new Request('http://localhost:3000/api/recordings/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '' }),
      });

      const res = await controller.ask(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe(ResponseCode.BAD_REQUEST);
      expect(mockService.askWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('speakers', () => {
    it('handles getSpeakers request and returns speakers list', async () => {
      const mockResult: ApiResponse<SpeakerDirectoryResponse> = {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Speakers retrieved',
        data: {
          count: 1,
          speakers: [
            {
              name: 'John Doe',
              total_meetings: 3,
              total_talk_time: 1800,
              last_active: '2026-10-06T10:00:00Z',
            },
          ],
        },
        timestamp: new Date().toISOString(),
      };

      vi.mocked(mockService.getSpeakers).mockResolvedValue(mockResult);

      const req = new Request('http://localhost:3000/api/speakers');
      const res = await controller.speakers(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.speakers).toHaveLength(1);
      expect(mockService.getSpeakers).toHaveBeenCalled();
    });
  });
});
