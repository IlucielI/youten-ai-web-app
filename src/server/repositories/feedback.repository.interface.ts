import { FeedbackRequest, FeedbackResponse } from '../dtos/feedback.dto';
import { ApiResponse } from '../dtos/response.dto';

export interface IFeedbackRepository {
  submitFeedback(payload: FeedbackRequest): Promise<ApiResponse<FeedbackResponse>>;
}
