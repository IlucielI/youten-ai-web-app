import { TemplateListResponse } from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export interface ITemplateService {
  listTemplates(): Promise<ApiResponse<TemplateListResponse>>;
}
