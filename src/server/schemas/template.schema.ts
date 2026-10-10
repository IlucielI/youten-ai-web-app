import { z } from 'zod';

export const TemplateItemSchema = z.object({
  id: z.string(),
  category_key: z.string(),
  name: z.string(),
  description: z.string(),
  is_active: z.boolean(),
});
export type TemplateItemInput = z.infer<typeof TemplateItemSchema>;

export const TemplateListResponseSchema = z.object({
  items: z.array(TemplateItemSchema),
});
export type TemplateListResponseDto = z.infer<typeof TemplateListResponseSchema>;
