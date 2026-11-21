import { NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IWorkspaceService } from '../services/workspace.service.interface';
import { workspaceService as defaultWorkspaceService } from '../services/workspace.service';
import {
  SemanticSearchQuerySchema,
  WorkspaceAskRequestSchema,
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  UpdateMemberRoleSchema,
  CreateInvitationSchema,
  CreateFolderSchema,
  UpdateFolderSchema,
  MoveRecordingFolderSchema,
} from '../schemas/workspace.schema';
import { WORKSPACE_COOKIE_NAME } from '../constants/auth.constant';
import { ILogger } from '../logger/logger.interface';
import { z } from 'zod';

export class WorkspaceController extends BaseController {
  constructor(
    private readonly workspaceService: IWorkspaceService = defaultWorkspaceService,
    logger?: ILogger
  ) {
    super(logger);
  }

  async search(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const query = this.getQuery(req, SemanticSearchQuerySchema);
      return this.workspaceService.semanticSearch(query);
    });
  }

  async ask(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, WorkspaceAskRequestSchema);
      return this.workspaceService.askWorkspace(body);
    });
  }

  async speakers(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.getSpeakers();
    });
  }

  async listWorkspaces(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.listWorkspaces();
    });
  }

  async createWorkspace(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, CreateWorkspaceSchema);
      return this.workspaceService.createWorkspace(body);
    });
  }

  async getWorkspace(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.getWorkspace(id);
    });
  }

  async updateWorkspace(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, UpdateWorkspaceSchema);
      return this.workspaceService.updateWorkspace(id, body);
    });
  }

  async deleteWorkspace(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.deleteWorkspace(id);
    });
  }

  async listMembers(req: Request, workspaceId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.listMembers(workspaceId);
    });
  }

  async updateMemberRole(req: Request, workspaceId: string, userId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, UpdateMemberRoleSchema);
      return this.workspaceService.updateMemberRole(workspaceId, userId, body);
    });
  }

  async removeMember(req: Request, workspaceId: string, userId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.removeMember(workspaceId, userId);
    });
  }

  async listInvitations(req: Request, workspaceId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.listInvitations(workspaceId);
    });
  }

  async createInvitation(req: Request, workspaceId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, CreateInvitationSchema);
      return this.workspaceService.createInvitation(workspaceId, body);
    });
  }

  async revokeInvitation(req: Request, workspaceId: string, inviteId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.revokeInvitation(workspaceId, inviteId);
    });
  }

  async getInvitationByToken(req: Request, token: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.getInvitationByToken(token);
    });
  }

  async acceptInvitation(req: Request, token: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.acceptInvitation(token);
    });
  }

  async listFolders(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.listFolders();
    });
  }

  async createFolder(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, CreateFolderSchema);
      return this.workspaceService.createFolder(body);
    });
  }

  async updateFolder(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, UpdateFolderSchema);
      return this.workspaceService.updateFolder(id, body);
    });
  }

  async deleteFolder(req: Request, id: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.deleteFolder(id);
    });
  }

  async moveRecordingFolder(req: Request, recordingId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      const body = await this.getBody(req, MoveRecordingFolderSchema);
      return this.workspaceService.moveRecordingFolder(recordingId, body.folder_id ?? null);
    });
  }

  async setActiveWorkspace(req: Request): Promise<NextResponse> {
    const SetActiveSchema = z.object({
      workspace_id: z.string().uuid().nullable(),
    });
    return this.handle(req, async () => {
      const body = await this.getBody(req, SetActiveSchema);
      const res = NextResponse.json({
        status: 'SUCCESS',
        code: 'SUCCESS',
        message: 'Active workspace updated',
        data: { workspace_id: body.workspace_id },
        timestamp: new Date().toISOString(),
      });
      if (body.workspace_id) {
        res.cookies.set(WORKSPACE_COOKIE_NAME, body.workspace_id, {
          path: '/',
          httpOnly: false, // Accessible to client and server
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60,
        });
      } else {
        res.cookies.delete(WORKSPACE_COOKIE_NAME);
      }
      return res;
    });
  }

  async listChatSessions(req: Request): Promise<NextResponse> {
    return this.handle(req, async () => {
      const url = new URL(req.url);
      const folderId = url.searchParams.get('folder_id') || undefined;
      return this.workspaceService.listWorkspaceChatSessions(folderId);
    });
  }

  async createChatSession(req: Request): Promise<NextResponse> {
    const CreateSessionSchema = z.object({
      title: z.string().trim().max(120).optional(),
      folder_id: z.string().uuid().nullable().optional(),
    });
    return this.handle(req, async () => {
      const body = await this.getBody(req, CreateSessionSchema);
      return this.workspaceService.createWorkspaceChatSession(body);
    });
  }

  async getChatSessionHistory(req: Request, sessionId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.getWorkspaceChatSessionHistory(sessionId);
    });
  }

  async deleteChatSession(req: Request, sessionId: string): Promise<NextResponse> {
    return this.handle(req, async () => {
      return this.workspaceService.deleteWorkspaceChatSession(sessionId);
    });
  }
}

/**
 * Colocated singleton instance for WorkspaceController.
 */
export const workspaceController = new WorkspaceController();
