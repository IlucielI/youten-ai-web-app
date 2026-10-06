import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  UserProfileResponse,
} from '../dtos';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';

export interface IAuthService {
  register(payload: RegisterRequest): Promise<ApiResponse<AuthResponse>>;
  login(payload: LoginRequest): Promise<ApiResponse<AuthResponse>>;
  refreshToken(payload: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>>;
  logout(payload: LogoutRequest): Promise<BaseResponse>;
  forgotPassword(payload: ForgotPasswordRequest): Promise<BaseResponse>;
  resetPassword(payload: ResetPasswordRequest): Promise<BaseResponse>;
  getMe(): Promise<ApiResponse<UserProfileResponse>>;
}
