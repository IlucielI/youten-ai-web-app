import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IWorkspaceService } from '../services/workspace.service.interface';
import { workspaceService as defaultWorkspaceService } from '../services/workspace.service';
import {
  SemanticSearchQuerySchema,
  WorkspaceAskRequestSchema,
} from '../schemas/workspace.schema';
import { ILogger } from '../logger/logger.interface';

export class WorkspaceController extends BaseController {
  constructor(
    private readonly workspaceService: IWorkspaceService = defaultWorkspaceService,
    logger?: ILogger
  ) {
    super(logger);
  }

  async search(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const query = this.getQuery(req, SemanticSearchQuerySchema);
      return this.workspaceService.semanticSearch(query);
    });
  }

  async ask(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, WorkspaceAskRequestSchema);
      return this.workspaceService.askWorkspace(body);
    });
  }

  async speakers(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.getSpeakers();
    });
  }
}

/**
 * Colocated singleton instance for WorkspaceController.
 */
export const workspaceController = new WorkspaceController();
