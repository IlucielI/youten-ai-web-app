import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IRecordingService } from '../services/recording.service.interface';
import { recordingService as defaultRecordingService } from '../services/recording.service';
import {
  PresignUploadRequestSchema,
  UploadRecordingRequestSchema,
  ImportUrlRequestSchema,
} from '../schemas/recording.schema';
import { ILogger } from '../logger/logger.interface';

export class RecordingController extends BaseController {
  constructor(
    private readonly recordingService: IRecordingService = defaultRecordingService,
    logger?: ILogger
  ) {
    super(logger);
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
      return this.recordingService.getRecordingDetail(id);
    });
  }
}

/**
 * Colocated singleton instance for RecordingController.
 */
export const recordingController = new RecordingController();
