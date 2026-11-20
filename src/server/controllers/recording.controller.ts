import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IRecordingService } from '../services/recording.service.interface';
import { recordingService as defaultRecordingService } from '../services/recording.service';
import { BadRequestError, ForbiddenError, BadGatewayError } from '../errors/app.error';
import { ResponseStatus, ResponseCode } from '../constants';
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

  async proxyUpload(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const targetUrl = req.headers.get('x-upload-url') || new URL(req.url).searchParams.get('url');
      if (!targetUrl) {
        throw new BadRequestError('Missing target upload URL');
      }

      let parsed: URL;
      try {
        parsed = new URL(targetUrl);
      } catch {
        throw new BadRequestError('Invalid target upload URL');
      }

      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new BadRequestError('Invalid target upload URL protocol');
      }

      const isAllowedHost =
        parsed.hostname === 's3.bayuanugerah.my.id' ||
        parsed.hostname.endsWith('.bayuanugerah.my.id') ||
        parsed.hostname.includes('s3') ||
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1';

      if (!isAllowedHost) {
        throw new ForbiddenError('Target upload host is not allowed');
      }

      const contentType = req.headers.get('content-type') || 'application/octet-stream';

      const upstreamRes = await fetch(targetUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: req.body,
        // @ts-expect-error duplex is required in Node.js for streaming fetch request bodies
        duplex: 'half',
      });

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text().catch(() => '');
        throw new BadGatewayError(
          `Storage rejected upload: ${upstreamRes.status} ${errText.slice(0, 150)}`
        );
      }

      return {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'File successfully uploaded to storage via proxy',
        data: {
          uploaded: true,
        },
      };
    });
  }
}

/**
 * Colocated singleton instance for RecordingController.
 */
export const recordingController = new RecordingController();
