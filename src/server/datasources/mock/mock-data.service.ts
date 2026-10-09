import {
  AuthResponse,
  AnonTokenResponse,
  UserProfileResponse,
  UserResponse,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  PresignUploadRequest,
  PresignUploadResponse,
  UploadRecordingRequest,
  RecordingUploadResponse,
  ImportURLRequest,
  RecordingDetailResponse,
  RecordingListItemDTO,
  RecordingFilterQuery,
  BulkClaimRequest,
  BulkClaimResponse,
  ShareToggleRequest,
  ShareToggleResponse,
  SharedRecordingResponse,
  RetryRecordingResponse,
  UpdateSpeakersRequest,
  UpdateSpeakersResponse,
  SummaryVersionResponse,
  RegenerateSummaryRequest,
  CommentResponse,
  CreateCommentRequest,
  SemanticSearchQuery,
  SemanticSearchResponse,
  WorkspaceAskRequest,
  WorkspaceAskResponse,
  SpeakerDirectoryResponse,
  WaitlistRequest,
  WaitlistResponse,
  DispatchMeetingBotRequest,
  DispatchMeetingBotResponse,
  MeetingBotSessionStatusResponse,
  StopMeetingBotSessionResponse,
  CapabilitiesResponse,
} from '../../dtos';
import {
  RecordingStatus,
  SourceType,
  TemplateKey,
  WaitlistStatus,
  UserStatus,
  CustomerUserRole,
  CustomerUserPermission,
} from '../../constants';
import {
  mockUser,
  mockUserProfile,
  mockAuthResponse,
  mockAnonTokenResponse,
  mockRecordingDetail,
  mockRecordingListItems,
  mockComments,
  mockSearchResults,
  mockWorkspaceAskResponse,
  mockSpeakers,
  mockSummaryDto,
  mockMomStructuredData,
  mockOneOnOneStructuredData,
  mockInterviewStructuredData,
  mockTechReviewStructuredData,
  mockSalesDiscoveryStructuredData,
  mockDailyStandupStructuredData,
  mockGeneralStructuredData,
} from './fixtures';

/**
 * Stateful in-memory mock data store for BFF local development and testing.
 * Provides realistic mutations, query filtering, and contract compliance.
 */
export class MockDataService {
  private user: UserResponse = { ...mockUser };
  private userProfile: UserProfileResponse = { ...mockUserProfile };
  private recordings: RecordingDetailResponse[] = [{ ...mockRecordingDetail }];
  private listItems: RecordingListItemDTO[] = [...mockRecordingListItems];
  private comments: CommentResponse[] = JSON.parse(JSON.stringify(mockComments));
  private summaryVersions: Map<string, SummaryVersionResponse[]> = new Map();
  private waitlistApplicants: WaitlistResponse[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.user = { ...mockUser };
    this.userProfile = { ...mockUserProfile };
    this.recordings = [{ ...mockRecordingDetail }];
    this.listItems = [...mockRecordingListItems];
    this.comments = JSON.parse(JSON.stringify(mockComments));
    this.waitlistApplicants = [];
    this.summaryVersions.clear();

    // Seed initial summary version for default mock recording
    const initialVersion: SummaryVersionResponse = {
      id: mockSummaryDto.id,
      version: 1,
      template_category: TemplateKey.MOM,
      custom_angle: mockSummaryDto.custom_angle,
      structured_data: mockMomStructuredData as unknown as Record<string, unknown>,
      markdown_content: mockSummaryDto.markdown_content,
      is_active: true,
      created_at: mockSummaryDto.created_at,
    };
    this.summaryVersions.set(mockRecordingDetail.id, [initialVersion]);
  }

  // --- Auth Handlers ---
  anonToken(): AnonTokenResponse {
    return {
      ...mockAnonTokenResponse,
      session_id: crypto.randomUUID(),
    };
  }

  register(payload: RegisterRequest): AuthResponse {
    this.user = {
      id: crypto.randomUUID(),
      email: payload.email,
      full_name: payload.full_name,
      status: UserStatus.ACTIVE,
      role_id: '11111111-1111-1111-1111-111111111111',
      role_code: CustomerUserRole.FREE,
      role_name: 'Free Member',
      permissions: [
        CustomerUserPermission.RECORDINGS_READ,
        CustomerUserPermission.RECORDINGS_CREATE,
        CustomerUserPermission.EXPORT_MARKDOWN,
      ],
      daily_quota: 5,
      daily_quota_override: null,
      email_verified: true,
      created_at: new Date().toISOString(),
    };
    this.userProfile = {
      ...this.user,
      quota_used_today: 0,
      quota_remaining: 5,
    };
    return {
      ...mockAuthResponse,
      user: this.user,
      claimed_recordings_count: payload.anon_token ? 1 : 0,
    };
  }

  login(payload: LoginRequest): AuthResponse {
    this.user = {
      ...this.user,
      email: payload.email,
    };
    this.userProfile = {
      ...this.userProfile,
      email: payload.email,
    };
    return {
      ...mockAuthResponse,
      user: this.user,
      claimed_recordings_count: payload.anon_token ? 1 : 0,
    };
  }

  refreshToken(payload: RefreshTokenRequest): AuthResponse {
    void payload;
    return {
      access_token: `mock-jwt-refreshed-${crypto.randomUUID()}`,
      refresh_token: `mock-refresh-${crypto.randomUUID()}`,
      token_type: 'Bearer',
      expires_in: 900,
      refresh_expires_in: 604800,
      user: this.user,
    };
  }

  getMe(): UserProfileResponse {
    return { ...this.userProfile };
  }

  updateProfile(payload: UpdateProfileRequest): UserResponse {
    this.user.full_name = payload.full_name;
    this.userProfile.full_name = payload.full_name;
    return { ...this.user };
  }

  changePassword(payload: ChangePasswordRequest): { success: boolean } {
    void payload;
    return { success: true };
  }

  // --- Recording Handlers ---
  presignUpload(payload: PresignUploadRequest): PresignUploadResponse {
    const objectKey = `recordings/${crypto.randomUUID()}/${payload.filename}`;
    return {
      upload_url: `https://mock-s3.youten.ai/bucket/${objectKey}?signature=mock-presigned-sig`,
      object_key: objectKey,
      filename: payload.filename,
    };
  }

  uploadRecording(payload: UploadRecordingRequest): RecordingUploadResponse {
    const id = crypto.randomUUID();
    const title = payload.title || payload.filename;
    const selectedTemplate = payload.template || TemplateKey.MOM;

    const newDetail: RecordingDetailResponse = {
      id,
      user_id: this.user.id,
      title,
      original_filename: payload.filename,
      file_size_bytes: 10485760,
      duration_seconds: 120.0,
      audio_url: `https://cdn.youten.ai/${payload.object_key}`,
      playback_url: `https://cdn.youten.ai/${payload.object_key}`,
      source_type: SourceType.UPLOAD,
      status: RecordingStatus.EXTRACTING,
      error_message: null,
      error_code: null,
      selected_template: selectedTemplate,
      detected_language: payload.language || 'en',
      output_language: payload.language || 'en',
      is_guest: false,
      consent_given: true,
      consent_version: 'v1.0',
      expires_at: null,
      analytics_data: null,
      segments: [],
      active_summary: null,
      chapters: [],
      highlights: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newListItem: RecordingListItemDTO = {
      id,
      title,
      original_filename: payload.filename,
      duration_seconds: 120.0,
      file_size_bytes: 10485760,
      source_type: SourceType.UPLOAD,
      status: RecordingStatus.EXTRACTING,
      selected_template: selectedTemplate,
      output_language: payload.language || 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.recordings.unshift(newDetail);
    this.listItems.unshift(newListItem);

    return {
      id,
      title,
      original_filename: payload.filename,
      file_size_bytes: 10485760,
      status: RecordingStatus.EXTRACTING,
      selected_template: selectedTemplate,
      output_language: payload.language || 'en',
      is_guest: false,
      ownership_token: null,
      created_at: newDetail.created_at,
    };
  }

  importUrl(payload: ImportURLRequest): RecordingUploadResponse {
    const id = crypto.randomUUID();
    const title = payload.title || 'Imported Recording';
    const selectedTemplate = payload.template || TemplateKey.MOM;

    return {
      id,
      title,
      original_filename: 'imported_audio.mp3',
      file_size_bytes: 5242880,
      status: RecordingStatus.PENDING,
      selected_template: selectedTemplate,
      output_language: payload.language || 'en',
      is_guest: false,
      ownership_token: null,
      created_at: new Date().toISOString(),
    };
  }

  getRecordingDetail(id: string): RecordingDetailResponse | null {
    const found = this.recordings.find((r) => r.id === id);
    return found ? { ...found } : null;
  }

  listRecordings(query: RecordingFilterQuery = {}): { items: RecordingListItemDTO[]; total: number } {
    let filtered = [...this.listItems];
    const { search, template, status, page = 1, limit = 10 } = query;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) => r.title.toLowerCase().includes(q));
    }

    if (template) {
      filtered = filtered.filter((r) => r.selected_template === template);
    }

    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      items,
      total: filtered.length,
    };
  }

  deleteRecording(id: string): boolean {
    const initialLen = this.recordings.length;
    this.recordings = this.recordings.filter((r) => r.id !== id);
    this.listItems = this.listItems.filter((r) => r.id !== id);
    return this.recordings.length < initialLen;
  }

  claimRecording(id: string): { claimed: boolean } {
    const recording = this.recordings.find((r) => r.id === id);
    if (recording) {
      recording.is_guest = false;
      recording.user_id = this.user.id;
      return { claimed: true };
    }
    return { claimed: false };
  }

  claimBulkRecordings(payload: BulkClaimRequest): BulkClaimResponse {
    const claimedIds: string[] = [];
    for (const token of payload.tokens) {
      claimedIds.push(`rec-claimed-${token.slice(0, 8)}`);
    }
    return {
      claimed_count: claimedIds.length,
      recording_ids: claimedIds,
    };
  }

  toggleShare(id: string, payload: ShareToggleRequest): ShareToggleResponse {
    const isShareEnabled = payload.is_share_enabled;
    const token = isShareEnabled ? `share-${id.slice(0, 8)}-${Date.now()}` : null;
    return {
      is_share_enabled: isShareEnabled,
      share_token: token,
      share_url: token ? `https://youten.ai/share/${token}` : null,
    };
  }

  getSharedRecording(token: string): SharedRecordingResponse | null {
    void token;
    const base = this.recordings[0];
    if (!base) return null;

    return {
      id: base.id,
      title: base.title,
      duration_seconds: base.duration_seconds,
      audio_url: base.audio_url,
      playback_url: base.playback_url,
      selected_template: base.selected_template,
      output_language: base.output_language,
      active_summary: base.active_summary,
      segments: base.segments,
      chapters: base.chapters,
      highlights: base.highlights,
      created_at: base.created_at,
    };
  }

  retryRecording(id: string): RetryRecordingResponse {
    const recording = this.recordings.find((r) => r.id === id);
    if (recording) {
      recording.status = RecordingStatus.TRANSCRIBING;
      recording.error_message = null;
      recording.error_code = null;
    }
    return {
      id,
      status: RecordingStatus.TRANSCRIBING,
      stage: 'transcription',
      message: 'Pipeline processing resumed from failed stage without re-upload.',
      updated_at: new Date().toISOString(),
    };
  }

  updateSpeakers(id: string, payload: UpdateSpeakersRequest): UpdateSpeakersResponse {
    const recording = this.recordings.find((r) => r.id === id);
    let updatedCount = 0;

    if (recording) {
      for (const segment of recording.segments) {
        if (payload.speakers[segment.speaker_label]) {
          segment.speaker_name = payload.speakers[segment.speaker_label];
          updatedCount++;
        }
      }
    }

    return {
      updated_count: updatedCount,
      speakers: payload.speakers,
    };
  }

  // --- Summary Handlers ---
  regenerateSummary(recordingId: string, payload: RegenerateSummaryRequest): SummaryVersionResponse {
    const versions = this.summaryVersions.get(recordingId) || [];
    const nextVerNum = versions.length + 1;
    const template = (payload.template_category as TemplateKey) || TemplateKey.MOM;

    let structured: Record<string, unknown>;
    switch (template) {
      case TemplateKey.ONE_ON_ONE:
        structured = mockOneOnOneStructuredData as unknown as Record<string, unknown>;
        break;
      case TemplateKey.INTERVIEW:
        structured = mockInterviewStructuredData as unknown as Record<string, unknown>;
        break;
      case TemplateKey.TECH_REVIEW:
        structured = mockTechReviewStructuredData as unknown as Record<string, unknown>;
        break;
      case TemplateKey.SALES_DISCOVERY:
        structured = mockSalesDiscoveryStructuredData as unknown as Record<string, unknown>;
        break;
      case TemplateKey.DAILY_STANDUP:
        structured = mockDailyStandupStructuredData as unknown as Record<string, unknown>;
        break;
      case TemplateKey.GENERAL:
        structured = mockGeneralStructuredData as unknown as Record<string, unknown>;
        break;
      case TemplateKey.MOM:
      default:
        structured = mockMomStructuredData as unknown as Record<string, unknown>;
        break;
    }

    // Set previously active version to inactive
    versions.forEach((v) => {
      v.is_active = false;
    });

    const newVersion: SummaryVersionResponse = {
      id: crypto.randomUUID(),
      version: nextVerNum,
      template_category: template,
      custom_angle: payload.custom_angle ?? null,
      structured_data: structured,
      markdown_content: `# Regenerated Summary (v${nextVerNum})\n\nGenerated using template: **${template}**.`,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    versions.push(newVersion);
    this.summaryVersions.set(recordingId, versions);

    // Update active summary in recording detail
    const rec = this.recordings.find((r) => r.id === recordingId);
    if (rec) {
      rec.active_summary = {
        id: newVersion.id,
        version: newVersion.version,
        template_category: newVersion.template_category,
        custom_angle: newVersion.custom_angle,
        structured_data: newVersion.structured_data,
        markdown_content: newVersion.markdown_content,
        is_active: true,
        created_at: newVersion.created_at,
        updated_at: newVersion.created_at,
      };
      rec.selected_template = template;
    }

    return newVersion;
  }

  listSummaryVersions(recordingId: string): SummaryVersionResponse[] {
    return this.summaryVersions.get(recordingId) || [];
  }

  activateSummaryVersion(recordingId: string, versionId: string): SummaryVersionResponse | null {
    const versions = this.summaryVersions.get(recordingId);
    if (!versions) return null;

    let activated: SummaryVersionResponse | null = null;
    versions.forEach((v) => {
      if (v.id === versionId) {
        v.is_active = true;
        activated = v;
      } else {
        v.is_active = false;
      }
    });

    if (activated) {
      const rec = this.recordings.find((r) => r.id === recordingId);
      if (rec) {
        rec.active_summary = {
          id: (activated as SummaryVersionResponse).id,
          version: (activated as SummaryVersionResponse).version,
          template_category: (activated as SummaryVersionResponse).template_category,
          custom_angle: (activated as SummaryVersionResponse).custom_angle,
          structured_data: (activated as SummaryVersionResponse).structured_data,
          markdown_content: (activated as SummaryVersionResponse).markdown_content,
          is_active: true,
          created_at: (activated as SummaryVersionResponse).created_at,
          updated_at: (activated as SummaryVersionResponse).created_at,
        };
      }
    }

    return activated;
  }

  // --- Comments Handlers ---
  createComment(recordingId: string, payload: CreateCommentRequest): CommentResponse {
    const newComment: CommentResponse = {
      id: crypto.randomUUID(),
      recording_id: recordingId,
      user_id: this.user.id,
      author_name: payload.author_name || this.user.full_name,
      timestamp_sec: payload.timestamp_sec,
      selected_text: payload.selected_text ?? null,
      comment_text: payload.comment_text,
      parent_id: payload.parent_id ?? null,
      replies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (payload.parent_id) {
      const parent = this.comments.find((c) => c.id === payload.parent_id);
      if (parent) {
        if (!parent.replies) {
          parent.replies = [];
        }
        parent.replies.push(newComment);
        return newComment;
      }
    }

    this.comments.push(newComment);
    return newComment;
  }

  listComments(recordingId: string): CommentResponse[] {
    return this.comments.filter((c) => c.recording_id === recordingId && !c.parent_id);
  }

  deleteComment(commentId: string): boolean {
    const initialLen = this.comments.length;
    this.comments = this.comments.filter((c) => c.id !== commentId);
    this.comments.forEach((c) => {
      if (c.replies) {
        c.replies = c.replies.filter((r) => r.id !== commentId);
      }
    });
    return this.comments.length < initialLen;
  }

  // --- Workspace Handlers ---
  semanticSearch(query: SemanticSearchQuery): SemanticSearchResponse {
    const limit = query.limit ?? 10;
    const results = mockSearchResults.slice(0, limit);
    return {
      query: query.q,
      count: results.length,
      results,
    };
  }

  askWorkspace(payload: WorkspaceAskRequest): WorkspaceAskResponse {
    return {
      answer: `Mock answer for question: "${payload.question}". ${mockWorkspaceAskResponse.answer}`,
      sources: mockWorkspaceAskResponse.sources,
    };
  }

  getSpeakers(): SpeakerDirectoryResponse {
    return {
      count: mockSpeakers.length,
      speakers: [...mockSpeakers],
    };
  }

  // --- Waitlist Handlers ---
  joinBotWaitlist(payload: WaitlistRequest): WaitlistResponse {
    const resp: WaitlistResponse = {
      email: payload.email,
      platform: payload.platform || 'google_meet',
      company_size: payload.company_size || '1-10',
      status: WaitlistStatus.PENDING,
      message: 'Successfully joined meeting voice bot beta waitlist',
    };
    this.waitlistApplicants.push(resp);
    return resp;
  }

  // --- Meeting Bot Handlers ---
  private botSessions: Map<string, MeetingBotSessionStatusResponse> = new Map();

  getCapabilities(): CapabilitiesResponse {
    return {
      meeting_bot: {
        discord: 'available',
        google_meet: 'available',
        ms_teams: 'available',
        zoom: 'available',
      },
    };
  }

  dispatchMeetingBot(payload: DispatchMeetingBotRequest): DispatchMeetingBotResponse {
    const sessionId = '11111111-2222-3333-4444-555555555555';
    const recordingId = '22222222-3333-4444-5555-666666666666';
    const session: MeetingBotSessionStatusResponse = {
      session_id: sessionId,
      recording_id: recordingId,
      provider: payload.provider,
      status: 'RECORDING',
      meeting_url: payload.meeting_url,
      started_at: new Date().toISOString(),
      ended_at: null,
      error_message: null,
    };
    this.botSessions.set(sessionId, session);
    this.botSessions.set(recordingId, session);

    return {
      recording_id: recordingId,
      session_id: sessionId,
      provider: payload.provider,
      status: 'DISPATCHED',
      meeting_url: payload.meeting_url,
      message: 'Bot dispatched successfully',
    };
  }

  getMeetingBotStatus(id: string): MeetingBotSessionStatusResponse {
    const existing = this.botSessions.get(id);
    if (existing) {
      return existing;
    }
    return {
      session_id: id,
      recording_id: id,
      provider: 'google_meet',
      status: 'RECORDING',
      meeting_url: 'https://meet.google.com/abc-defg-hij',
      started_at: new Date().toISOString(),
      ended_at: null,
      error_message: null,
    };
  }

  stopMeetingBotSession(id: string): StopMeetingBotSessionResponse {
    const session = this.botSessions.get(id);
    if (session) {
      session.status = 'COMPLETED';
      session.ended_at = new Date().toISOString();
    }
    return {
      session_id: id,
      recording_id: session?.recording_id || id,
      status: 'COMPLETED',
      message: 'Bot leave command dispatched successfully',
    };
  }
}

/**
 * Singleton mock data service instance.
 */
export const mockDataService = new MockDataService();
