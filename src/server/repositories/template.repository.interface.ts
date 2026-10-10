import { TemplateListResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export interface ITemplateRepository {
  listTemplates(): Promise<ApiResponse<TemplateListResponse>>;
}
