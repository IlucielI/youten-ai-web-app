import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { ITemplateService } from '../services/template.service.interface';
import { templateService as defaultTemplateService } from '../services/template.service';
import { ILogger } from '../logger/logger.interface';

export class TemplateController extends BaseController {
  constructor(
    private readonly templateService: ITemplateService = defaultTemplateService,
    logger?: ILogger
  ) {
    super(logger);
  }

  async listTemplates(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.templateService.listTemplates();
    });
  }
}

/**
 * Colocated singleton instance for TemplateController.
 */
export const templateController = new TemplateController();
