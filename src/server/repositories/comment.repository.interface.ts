import {
  CreateCommentRequest,
  CommentResponse,
} from '../dtos';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';

export interface ICommentRepository {
  createComment(
    recordingId: string,
    payload: CreateCommentRequest
  ): Promise<ApiResponse<CommentResponse>>;
  listComments(recordingId: string): Promise<ApiResponse<CommentResponse[]>>;
  deleteComment(recordingId: string, commentId: string): Promise<BaseResponse>;
}
