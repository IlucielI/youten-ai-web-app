import { describe, it, expect, beforeEach } from 'vitest';
import {
  AuthRepository,
  RecordingRepository,
  SummaryRepository,
  CommentRepository,
  WorkspaceRepository,
  WaitlistRepository,
  MeetingBotRepository,
} from './index';
import { MockDataService } from '../datasources/mock';
import { HttpClient } from '../datasources/http';
import {
  TemplateKey,
  RecordingStatus,
  WaitlistStatus,
  ResponseStatus,
  ResponseCode,
  BotProvider,
} from '../constants';

describe('BFF Domain Repositories (Mock & Transport Layer)', () => {
  let mockService: MockDataService;
  let authRepo: AuthRepository;
  let recordingRepo: RecordingRepository;
  let summaryRepo: SummaryRepository;
  let commentRepo: CommentRepository;
  let workspaceRepo: WorkspaceRepository;
  let waitlistRepo: WaitlistRepository;
  let meetingBotRepo: MeetingBotRepository;

  beforeEach(() => {
    mockService = new MockDataService();
    const fakeHttp = new HttpClient({ baseUrl: 'https://fake-upstream.internal' });

    authRepo = new AuthRepository(fakeHttp, mockService, true);
    recordingRepo = new RecordingRepository(fakeHttp, mockService, true);
    summaryRepo = new SummaryRepository(fakeHttp, mockService, true);
    commentRepo = new CommentRepository(fakeHttp, mockService, true);
    workspaceRepo = new WorkspaceRepository(fakeHttp, mockService, true);
    waitlistRepo = new WaitlistRepository(fakeHttp, mockService, true);
    meetingBotRepo = new MeetingBotRepository(fakeHttp, mockService, true);
  });

  describe('AuthRepository', () => {
    it('should generate an anonymous token session', async () => {
      const resp = await authRepo.anonToken();

      expect(resp.status).toBe(ResponseStatus.SUCCESS);
      expect(resp.code).toBe(ResponseCode.SUCCESS);
      expect(resp.data?.anon_token).toBeDefined();
      expect(resp.data?.session_id).toBeDefined();
      expect(resp.data?.scopes).toContain('recordings:create');
    });

    it('should register a new user and return auth response', async () => {
      const resp = await authRepo.register({
        email: 'newuser@example.com',
        password: 'Password123',
        full_name: 'New User',
      });

      expect(resp.status).toBe(ResponseStatus.SUCCESS);
      expect(resp.code).toBe(ResponseCode.SUCCESS);
      expect(resp.data?.user.email).toBe('newuser@example.com');
      expect(resp.data?.user.full_name).toBe('New User');
      expect(resp.data?.access_token).toBeDefined();
    });

    it('should login user and return tokens', async () => {
      const resp = await authRepo.login({
        email: 'user@example.com',
        password: 'Password123',
      });

      expect(resp.status).toBe(ResponseStatus.SUCCESS);
      expect(resp.data?.access_token).toBeDefined();
      expect(resp.data?.refresh_token).toBeDefined();
    });

    it('should rotate tokens via refreshToken preserving user session', async () => {
      await authRepo.login({
        email: 'alice@company.com',
        password: 'Password123',
      });

      const refreshResp = await authRepo.refreshToken({
        refresh_token: 'valid-refresh-token',
      });

      expect(refreshResp.status).toBe(ResponseStatus.SUCCESS);
      expect(refreshResp.data?.access_token).toBeDefined();
      expect(refreshResp.data?.access_token).toContain('mock-jwt-refreshed');
      expect(refreshResp.data?.user.email).toBe('alice@company.com');
    });

    it('should retrieve current user profile with quota stats', async () => {
      const resp = await authRepo.getMe();
      expect(resp.status).toBe(ResponseStatus.SUCCESS);
      expect(resp.data?.daily_quota).toBe(5);
      expect(resp.data?.quota_remaining).toBeGreaterThanOrEqual(0);
    });

    it('should update user profile name', async () => {
      const resp = await authRepo.updateProfile({ full_name: 'Bayu Updated' });
      expect(resp.data?.full_name).toBe('Bayu Updated');

      const me = await authRepo.getMe();
      expect(me.data?.full_name).toBe('Bayu Updated');
    });

    it('should handle change password, logout, forgot password, and reset password', async () => {
      const cp = await authRepo.changePassword({ old_password: 'Pass1', new_password: 'Pass2' });
      expect(cp.status).toBe(ResponseStatus.SUCCESS);

      const lo = await authRepo.logout({ refresh_token: 'token-123' });
      expect(lo.status).toBe(ResponseStatus.SUCCESS);

      const fp = await authRepo.forgotPassword({ email: 'user@example.com' });
      expect(fp.status).toBe(ResponseStatus.SUCCESS);

      const rp = await authRepo.resetPassword({ token: 'tok', new_password: 'Pass3' });
      expect(rp.status).toBe(ResponseStatus.SUCCESS);
    });
  });

  describe('RecordingRepository', () => {
    it('should generate a direct-to-S3 presigned upload URL', async () => {
      const resp = await recordingRepo.presignUpload({
        filename: 'weekly_sync.mp4',
        content_type: 'video/mp4',
      });

      expect(resp.status).toBe(ResponseStatus.SUCCESS);
      expect(resp.data?.upload_url).toContain('https://mock-s3.youten.ai/bucket/');
      expect(resp.data?.object_key).toContain('weekly_sync.mp4');
      expect(resp.data?.filename).toBe('weekly_sync.mp4');
    });

    it('should confirm recording upload and start in EXTRACTING status', async () => {
      const resp = await recordingRepo.uploadRecording({
        filename: 'weekly_sync.mp4',
        object_key: 'recordings/uuid/weekly_sync.mp4',
        title: 'Weekly Team Sync',
        template: TemplateKey.MOM,
        language: 'en',
      });

      expect(resp.status).toBe(ResponseStatus.SUCCESS);
      expect(resp.data?.title).toBe('Weekly Team Sync');
      expect(resp.data?.status).toBe(RecordingStatus.EXTRACTING);
    });

    it('should retrieve full recording detail with diarized segments and karaoke words', async () => {
      const list = await recordingRepo.listRecordings();
      const firstId = list.data[0].id;

      const detail = await recordingRepo.getRecordingDetail(firstId);
      expect(detail.status).toBe(ResponseStatus.SUCCESS);
      expect(detail.data?.segments.length).toBeGreaterThan(0);
      expect(detail.data?.segments[0].words_data?.length).toBeGreaterThan(0);
      expect(detail.data?.chapters.length).toBeGreaterThan(0);
      expect(detail.data?.active_summary).toBeDefined();

      let expectedTotalWords = 0;
      if (detail.data?.segments) {
        for (const s of detail.data.segments) {
          if (s.words_data) {
            expectedTotalWords += s.words_data.length;
          }
        }
      }
      const analytics = detail.data?.analytics_data as { total_words?: number } | undefined;
      expect(analytics?.total_words).toBe(expectedTotalWords);
    });

    it('should paginate and filter recordings list by search and template', async () => {
      const unconstrained = await recordingRepo.listRecordings();
      expect(unconstrained.data.length).toBeGreaterThanOrEqual(1);

      const all = await recordingRepo.listRecordings({ page: 1, limit: 10 });
      expect(all.pagination.totalItems).toBeGreaterThanOrEqual(1);

      const filtered = await recordingRepo.listRecordings({
        search: 'Architectural',
        template: TemplateKey.MOM,
      });
      expect(filtered.data.length).toBeGreaterThanOrEqual(1);
      expect(filtered.data[0].selected_template).toBe(TemplateKey.MOM);
    });

    it('should toggle public share status and retrieve shared recording', async () => {
      const list = await recordingRepo.listRecordings();
      const id = list.data[0].id;

      const shareResp = await recordingRepo.toggleShare(id, { is_share_enabled: true });
      expect(shareResp.data?.is_share_enabled).toBe(true);
      expect(shareResp.data?.share_token).toBeDefined();

      const sharedToken = shareResp.data!.share_token!;
      const viewerResp = await recordingRepo.getSharedRecording(sharedToken);
      expect(viewerResp.status).toBe(ResponseStatus.SUCCESS);
      expect(viewerResp.data?.title).toBeDefined();
    });

    it('should update speaker names across transcript segments', async () => {
      const list = await recordingRepo.listRecordings();
      const id = list.data[0].id;

      const updateResp = await recordingRepo.updateSpeakers(id, {
        speakers: {
          'Speaker 0': 'Alice Mercer',
        },
      });
      expect(updateResp.data?.updated_count).toBeGreaterThan(0);

      const detail = await recordingRepo.getRecordingDetail(id);
      const updated = detail.data?.segments.find((s) => s.speaker_label === 'Speaker 0');
      expect(updated?.speaker_name).toBe('Alice Mercer');
    });

    it('should retry a failed recording stage and claim guest recordings', async () => {
      const list = await recordingRepo.listRecordings();
      const id = list.data[0].id;

      const retryResp = await recordingRepo.retryRecording(id);
      expect(retryResp.data?.status).toBe(RecordingStatus.TRANSCRIBING);

      const claimResp = await recordingRepo.claimRecording(id);
      expect(claimResp.data?.claimed).toBe(true);

      const nonExistentClaim = await recordingRepo.claimRecording('00000000-non-existent-id');
      expect(nonExistentClaim.data?.claimed).toBe(false);

      const bulkResp = await recordingRepo.claimBulk({
        tokens: ['guest-tok-1', 'guest-tok-2'],
      });
      expect(bulkResp.data?.claimed_count).toBe(2);
    });
  });

  describe('SummaryRepository', () => {
    it('should list summary versions and regenerate with a new template', async () => {
      const list = await recordingRepo.listRecordings();
      const recordingId = list.data[0].id;

      const initialVersions = await summaryRepo.listSummaryVersions(recordingId);
      expect(initialVersions.data?.length).toBeGreaterThanOrEqual(1);

      const regen = await summaryRepo.regenerateSummary(recordingId, {
        template_category: TemplateKey.TECH_REVIEW,
        custom_angle: 'Focus on database latency degradation',
      });
      expect(regen.status).toBe(ResponseStatus.SUCCESS);
      expect(regen.data?.template_category).toBe(TemplateKey.TECH_REVIEW);
      expect(regen.data?.version).toBe(2);
      expect(regen.data?.is_active).toBe(true);

      const updatedVersions = await summaryRepo.listSummaryVersions(recordingId);
      expect(updatedVersions.data?.length).toBe(2);
    });

    it('should activate a specific historical summary version', async () => {
      const list = await recordingRepo.listRecordings();
      const recordingId = list.data[0].id;

      await summaryRepo.regenerateSummary(recordingId, {
        template_category: TemplateKey.INTERVIEW,
      });

      const versions = await summaryRepo.listSummaryVersions(recordingId);
      const v1 = versions.data?.find((v) => v.version === 1);
      expect(v1).toBeDefined();

      const activateV1 = await summaryRepo.activateSummaryVersion(recordingId, v1!.id);
      expect(activateV1.data?.version).toBe(1);
      expect(activateV1.data?.is_active).toBe(true);
    });
  });

  describe('CommentRepository', () => {
    it('should create timestamped inline comment and threaded reply', async () => {
      const list = await recordingRepo.listRecordings();
      const recordingId = list.data[0].id;

      const rootComment = await commentRepo.createComment(recordingId, {
        timestamp_sec: 10.0,
        author_name: 'Bayu Anugerah',
        selected_text: 'vector database latency',
        comment_text: 'Investigate indexing options.',
      });
      expect(rootComment.data?.comment_text).toBe('Investigate indexing options.');

      const reply = await commentRepo.createComment(recordingId, {
        timestamp_sec: 10.0,
        author_name: 'Bob',
        comment_text: 'HNSW is planned.',
        parent_id: rootComment.data!.id,
      });
      expect(reply.data?.comment_text).toBe('HNSW is planned.');

      const allComments = await commentRepo.listComments(recordingId);
      expect(allComments.data?.length).toBeGreaterThanOrEqual(1);

      const del = await commentRepo.deleteComment(recordingId, rootComment.data!.id);
      expect(del.status).toBe(ResponseStatus.SUCCESS);
    });
  });

  describe('WorkspaceRepository', () => {
    it('should perform semantic search and return relevance ranked chunks', async () => {
      const searchResp = await workspaceRepo.semanticSearch({
        q: 'pgvector migration',
        limit: 5,
      });
      expect(searchResp.status).toBe(ResponseStatus.SUCCESS);
      expect(searchResp.data?.results.length).toBeGreaterThan(0);
      expect(searchResp.data?.results[0].score).toBeGreaterThan(0.8);
    });

    it('should ask workspace memory and return answer with citations', async () => {
      const askResp = await workspaceRepo.askWorkspace({
        question: 'What database did the team decide on?',
      });
      expect(askResp.status).toBe(ResponseStatus.SUCCESS);
      expect(askResp.data?.answer).toContain('pgvector');
      expect(askResp.data?.sources.length).toBeGreaterThan(0);
    });

    it('should retrieve workspace speaker directory and statistics', async () => {
      const speakersResp = await workspaceRepo.getSpeakers();
      expect(speakersResp.status).toBe(ResponseStatus.SUCCESS);
      expect(speakersResp.data?.speakers.length).toBeGreaterThan(0);
      expect(speakersResp.data?.speakers[0].name).toBeDefined();
    });
  });

  describe('WaitlistRepository', () => {
    it('should join the beta meeting voice bot waitlist', async () => {
      const resp = await waitlistRepo.joinBotWaitlist({
        email: 'lead@startup.io',
        platform: 'discord',
        company_size: '11-50',
      });
      expect(resp.status).toBe(ResponseStatus.SUCCESS);
      expect(resp.data?.email).toBe('lead@startup.io');
      expect(resp.data?.status).toBe(WaitlistStatus.PENDING);
    });
  });

  describe('MeetingBotRepository', () => {
    it('should get meeting bot capabilities', async () => {
      const resp = await meetingBotRepo.getCapabilities();
      expect(resp.status).toBe(ResponseStatus.SUCCESS);
      expect(resp.data?.meeting_bot.google_meet).toBe('available');
    });

    it('should dispatch bot session successfully', async () => {
      const resp = await meetingBotRepo.dispatch({
        provider: BotProvider.GOOGLE_MEET,
        meeting_url: 'https://meet.google.com/abc-defg-hij',
      });
      expect(resp.status).toBe(ResponseStatus.SUCCESS);
      expect(resp.data?.session_id).toBeDefined();
      expect(resp.data?.provider).toBe('google_meet');
    });

    it('should get session status and stop session', async () => {
      const dispatchResp = await meetingBotRepo.dispatch({
        provider: BotProvider.ZOOM,
        meeting_url: 'https://zoom.us/j/123456789',
      });
      const sessionId = dispatchResp.data!.session_id;

      const statusResp = await meetingBotRepo.getStatus(sessionId);
      expect(statusResp.status).toBe(ResponseStatus.SUCCESS);
      expect(statusResp.data?.session_id).toBe(sessionId);

      const stopResp = await meetingBotRepo.stop(sessionId);
      expect(stopResp.status).toBe(ResponseStatus.SUCCESS);
      expect(stopResp.data?.status).toBe('COMPLETED');
    });
  });
});
