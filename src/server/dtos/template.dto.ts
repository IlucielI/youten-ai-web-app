export interface TemplateItemDTO {
  id: string;
  category_key: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface TemplateListResponse {
  items: TemplateItemDTO[];
}
