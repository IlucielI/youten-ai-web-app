import {
  FeedbackRequest,
  FeedbackResponse,
  FeedbackPresignRequest,
  FeedbackPresignResponse,
} from '../dtos/feedback.dto';
import { ApiResponse } from '../dtos/response.dto';

export interface IFeedbackService {
  submitFeedback(payload: FeedbackRequest): Promise<ApiResponse<FeedbackResponse>>;
  presignUpload(payload: FeedbackPresignRequest): Promise<ApiResponse<FeedbackPresignResponse>>;
}

