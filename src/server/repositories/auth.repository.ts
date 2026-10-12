import { IAuthRepository } from './auth.repository.interface';
import { IHttpClient, HttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthResponse,
  UserProfileResponse,
  UserResponse,
  AnonTokenResponse,
} from '../dtos';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

export class AuthRepository implements IAuthRepository {
  private readonly http: IHttpClient;
  private readonly anonHttp: IHttpClient;
  private readonly mock: MockDataService;
  private readonly useMock: boolean;
  private cachedAnonToken: string | null = null;
  private anonTokenExpiresAt: number = 0;

  constructor(
    http: IHttpClient = defaultHttpClient,
    mock: MockDataService = defaultMockDataService,
    useMock: boolean = env.MOCK_CORE_API || env.USE_MOCK_DATA,
    anonHttp?: IHttpClient
  ) {
    this.http = http;
    this.mock = mock;
    this.useMock = useMock;
    this.anonHttp =
      anonHttp ||
      new HttpClient({
        baseUrl: env.CORE_API_URL,
        defaultTimeoutMs: 60000,
      });
  }

  async anonToken(): Promise<ApiResponse<AnonTokenResponse>> {
    if (this.useMock) {
      const data = this.mock.anonToken();
      return this.successResponse(data, 'Anonymous session created successfully');
    }
    const credentials = Buffer.from(`${env.CLIENT_APP_ID}:${env.CLIENT_APP_SECRET}`).toString('base64');
    return this.anonHttp.post<ApiResponse<AnonTokenResponse>>('/v1/auth/anon', undefined, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
  }

  async getGatewayAnonToken(): Promise<string> {
    if (this.useMock) {
      return 'mock-jwt-anon-token-xyz';
    }

    if (this.cachedAnonToken && Date.now() < this.anonTokenExpiresAt - 60000) {
      return this.cachedAnonToken;
    }

    const res = await this.anonToken();
    if (res.status === ResponseStatus.SUCCESS && res.data?.anon_token) {
      this.cachedAnonToken = res.data.anon_token;
      this.anonTokenExpiresAt = Date.now() + (res.data.expires_in || 604800) * 1000;
      return this.cachedAnonToken;
    }

    throw new Error('Failed to retrieve anonymous gateway token from Core API');
  }

  async register(payload: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    if (this.useMock) {
      const data = this.mock.register(payload);
      return this.successResponse(data, 'User registered successfully');
    }
    const regRes = await this.http.post<ApiResponse<UserResponse>>(
      '/v1/auth/register',
      payload,
      payload.anon_token ? { token: payload.anon_token } : undefined
    );
    if (!regRes || regRes.status !== 'success' || !regRes.data) {
      return regRes as unknown as ApiResponse<AuthResponse>;
    }

    return {
      status: regRes.status,
      code: regRes.code,
      message: regRes.message,
      data: {
        access_token: '',
        refresh_token: '',
        token_type: 'Bearer',
        expires_in: 0,
        refresh_expires_in: 0,
        user: regRes.data,
      },
      timestamp: regRes.timestamp,
    };
  }

  async login(payload: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    if (this.useMock) {
      const data = this.mock.login(payload);
      return this.successResponse(data, 'User logged in successfully');
    }
    return this.http.post<ApiResponse<AuthResponse>>(
      '/v1/auth/login',
      payload,
      payload.anon_token ? { token: payload.anon_token } : undefined
    );
  }

  async refreshToken(payload: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    if (this.useMock) {
      const data = this.mock.refreshToken(payload);
      return this.successResponse(data, 'Token rotated successfully');
    }
    return this.http.post<ApiResponse<AuthResponse>>('/v1/auth/refresh', payload);
  }

  async logout(payload: LogoutRequest): Promise<BaseResponse> {
    if (this.useMock) {
      return this.baseSuccessResponse('Session terminated successfully');
    }
    return this.http.post<BaseResponse>('/v1/auth/logout', payload);
  }

  async forgotPassword(payload: ForgotPasswordRequest): Promise<BaseResponse> {
    if (this.useMock) {
      return this.baseSuccessResponse('Password reset instructions sent');
    }
    return this.http.post<BaseResponse>('/v1/auth/forgot-password', payload);
  }

  async resetPassword(payload: ResetPasswordRequest): Promise<BaseResponse> {
    if (this.useMock) {
      return this.baseSuccessResponse('Password reset successfully');
    }
    return this.http.post<BaseResponse>('/v1/auth/reset-password', payload);
  }

  async verifyEmail(payload: VerifyEmailRequest): Promise<ApiResponse<AuthResponse>> {
    if (this.useMock) {
      const user = this.mock.getMe();
      return this.successResponse(
        {
          access_token: 'mock-verified-token',
          refresh_token: 'mock-verified-refresh',
          token_type: 'Bearer',
          expires_in: 86400,
          refresh_expires_in: 604800,
          user: { ...user, email_verified: true, status: 'active' },
        },
        'Email verified successfully'
      );
    }
    return this.http.post<ApiResponse<AuthResponse>>('/v1/auth/verify-email', payload);
  }

  async resendVerification(payload: ResendVerificationRequest): Promise<BaseResponse> {
    if (this.useMock) {
      return this.baseSuccessResponse('Verification email sent successfully');
    }
    return this.http.post<BaseResponse>('/v1/auth/verify-email/resend', payload);
  }

  async getMe(): Promise<ApiResponse<UserProfileResponse>> {
    if (this.useMock) {
      const data = this.mock.getMe();
      return this.successResponse(data, 'Profile retrieved successfully');
    }
    return this.http.get<ApiResponse<UserProfileResponse>>('/v1/auth/me');
  }

  async updateProfile(payload: UpdateProfileRequest): Promise<ApiResponse<UserResponse>> {
    if (this.useMock) {
      const data = this.mock.updateProfile(payload);
      return this.successResponse(data, 'Profile updated successfully');
    }
    return this.http.put<ApiResponse<UserResponse>>('/v1/auth/me', payload);
  }

  async changePassword(payload: ChangePasswordRequest): Promise<BaseResponse> {
    if (this.useMock) {
      this.mock.changePassword(payload);
      return this.baseSuccessResponse('Password changed successfully');
    }
    return this.http.put<BaseResponse>('/v1/auth/change-password', payload);
  }

  private successResponse<T>(data: T, message: string): ApiResponse<T> {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private baseSuccessResponse(message: string): BaseResponse {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Colocated singleton instance for AuthRepository.
 */
export const authRepository: IAuthRepository = new AuthRepository();

if (defaultHttpClient instanceof HttpClient) {
  defaultHttpClient.setAuthHeaderResolver(async () => {
    try {
      const token = await authRepository.getGatewayAnonToken();
      return `Bearer ${token}`;
    } catch {
      return null;
    }
  });
}
