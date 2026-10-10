import { ITemplateService } from './template.service.interface';
import {
  ITemplateRepository,
  templateRepository as defaultTemplateRepo,
} from '../repositories';
import { TemplateListResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export class TemplateService implements ITemplateService {
  private readonly templateRepo: ITemplateRepository;

  constructor(templateRepo: ITemplateRepository = defaultTemplateRepo) {
    this.templateRepo = templateRepo;
  }

  async listTemplates(): Promise<ApiResponse<TemplateListResponse>> {
    return this.templateRepo.listTemplates();
  }
}

/**
 * Colocated singleton instance for TemplateService.
 */
export const templateService: ITemplateService = new TemplateService();
