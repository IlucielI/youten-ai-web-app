import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IRecordingService } from '../services/recording.service.interface';
import { recordingService as defaultRecordingService } from '../services/recording.service';
import {
  PresignUploadRequestSchema,
  UploadRecordingRequestSchema,
  ImportUrlRequestSchema,
  ShareToggleRequestSchema,
  UpdateSpeakersRequestSchema,
  UpdateTranscriptSegmentRequestSchema,
  BulkClaimRequestSchema,
  RecordingFilterQuerySchema,
} from '../schemas/recording.schema';
import { RegenerateSummaryRequestSchema } from '../schemas/summary.schema';
import { ILogger } from '../logger/logger.interface';

export class RecordingController extends BaseController {
  constructor(
    private readonly recordingService: IRecordingService = defaultRecordingService,
    logger?: ILogger
  ) {
    super(logger);
  }

  async list(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const query = this.getQuery(req, RecordingFilterQuerySchema);
      return this.recordingService.listRecordings(query);
    });
  }

  async presign(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, PresignUploadRequestSchema);
      return this.recordingService.presignUpload(body);
    });
  }

  async upload(req: Request): Promise<NextResponse> {
    return this.handle(
      req,
      async () => {
        const body = await this.getBody(req, UploadRecordingRequestSchema);
        return this.recordingService.uploadRecording(body);
      },
      { status: 201 }
    );
  }

  async importUrl(req: Request): Promise<NextResponse> {
    return this.handle(
      req,
      async () => {
        const body = await this.getBody(req, ImportUrlRequestSchema);
        return this.recordingService.importUrl(body);
      },
      { status: 201 }
    );
  }

  async getDetail(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const url = new URL(req.url);
      const token = url.searchParams.get('token') || req.headers.get('x-ownership-token') || undefined;
      return this.recordingService.getRecordingDetail(id, token);
    });
  }

  async delete(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.recordingService.deleteRecording(id);
    });
  }

  async retry(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const url = new URL(req.url);
      const token = url.searchParams.get('token') || req.headers.get('x-ownership-token') || undefined;
      return this.recordingService.retryRecording(id, token);
    });
  }

  async toggleShare(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, ShareToggleRequestSchema);
      return this.recordingService.toggleShare(id, body);
    });
  }

  async updateSpeakers(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, UpdateSpeakersRequestSchema);
      return this.recordingService.updateSpeakers(id, body);
    });
  }

  async updateSegment(req: Request, id: string, segmentId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, UpdateTranscriptSegmentRequestSchema);
      const ownershipToken = req.headers.get('x-ownership-token') || body.ownership_token || undefined;
      return this.recordingService.updateTranscriptSegment(id, segmentId, {
        ...body,
        ownership_token: ownershipToken,
      });
    });
  }

  async getShared(req: Request, token: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.recordingService.getSharedRecording(token);
    });
  }

  async claim(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.recordingService.claimRecording(id);
    });
  }

  async claimBulk(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, BulkClaimRequestSchema);
      return this.recordingService.claimBulk(body);
    });
  }

  async regenerateSummary(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const ownershipToken = req.headers.get('x-ownership-token') || undefined;
      const body = await this.getBody(req, RegenerateSummaryRequestSchema);
      return this.recordingService.regenerateSummary(id, body, ownershipToken);
    });
  }

  async listSummaries(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const url = new URL(req.url);
      const token = url.searchParams.get('token') || req.headers.get('x-ownership-token') || undefined;
      return this.recordingService.listSummaryVersions(id, token);
    });
  }

  async activateSummary(req: Request, id: string, versionId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const url = new URL(req.url);
      const token = url.searchParams.get('token') || req.headers.get('x-ownership-token') || undefined;
      return this.recordingService.activateSummaryVersion(id, versionId, token);
    });
  }
}

/**
 * Colocated singleton instance for RecordingController.
 */
export const recordingController = new RecordingController();
