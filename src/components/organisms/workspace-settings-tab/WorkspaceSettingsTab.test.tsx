import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { WorkspaceSettingsTab } from './WorkspaceSettingsTab';
import * as apiClient from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { UserStatus } from '@/server/constants/recording.constant';
import { WorkspaceDTO, WorkspaceMemberDTO, WorkspaceInvitationDTO } from '@/server/dtos/workspace.dto';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('WorkspaceSettingsTab', () => {
  const mockUser = {
    id: 'user-bayu',
    email: 'bayu@example.com',
    full_name: 'Bayu Anugerah',
  };

  const ws1: WorkspaceDTO = {
    id: 'ws-1',
    name: "Bayu Anugerah's Workspace",
    slug: 'bayu-workspace',
    description: 'Personal workspace',
    owner_id: 'user-bayu',
    role: 'owner',
    created_at: '2026-01-01T00:00:00Z',
  };

  const ws2: WorkspaceDTO = {
    id: 'ws-2',
    name: 'Engineering Team',
    slug: 'eng-team',
    description: 'Collaborative team space',
    owner_id: 'user-boss',
    role: 'member',
    created_at: '2026-02-01T00:00:00Z',
  };

  const membersWs1: WorkspaceMemberDTO[] = [
    {
      id: 'mem-1',
      workspace_id: 'ws-1',
      user_id: 'user-bayu',
      role: 'owner',
      full_name: 'Bayu Anugerah',
      email: 'bayu@example.com',
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  const membersWs2: WorkspaceMemberDTO[] = [
    {
      id: 'mem-2',
      workspace_id: 'ws-2',
      user_id: 'user-boss',
      role: 'owner',
      full_name: 'The Boss',
      email: 'boss@example.com',
      created_at: '2026-02-01T00:00:00Z',
    },
    {
      id: 'mem-3',
      workspace_id: 'ws-2',
      user_id: 'user-bayu',
      role: 'member',
      full_name: 'Bayu Anugerah',
      email: 'bayu@example.com',
      created_at: '2026-02-02T00:00:00Z',
    },
  ];

  const invitesWs1: WorkspaceInvitationDTO[] = [
    {
      id: 'inv-1',
      workspace_id: 'ws-1',
      email: 'pending@example.com',
      role: 'member',
      token: 'tok-123',
      expires_at: '2026-12-31T00:00:00Z',
      created_at: '2026-11-20T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        ...mockUser,
        status: UserStatus.ACTIVE,
        daily_quota: 5,
        quota_used_today: 0,
        quota_remaining: 5,
        email_verified: true,
        created_at: '2026-01-01T00:00:00Z',
      },
    });

    useWorkspaceStore.setState({
      workspaces: [ws1, ws2],
      activeWorkspace: ws1,
      members: membersWs1,
      folders: [],
      activeFolderId: null,
      isLoading: false,
      isInitialized: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial workspace details, members, and pending invitations', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/workspaces/ws-1/members') {
        return { data: membersWs1 };
      }
      if (url === '/api/workspaces/ws-1/invites') {
        return { data: invitesWs1 };
      }
      return { data: [] };
    });

    render(<WorkspaceSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Bayu Anugerah's Workspace")).toBeInTheDocument();
      expect(screen.getByText('Team Members (1)')).toBeInTheDocument();
      expect(screen.getByText('Pending Invitations (1)')).toBeInTheDocument();
      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    });

    // Invite member button should be enabled for owner
    const inviteBtn = screen.getByTestId('invite-member-btn');
    expect(inviteBtn).not.toBeDisabled();
  });

  it('allows switching workspace via dropdown menu and loads selected workspace members', async () => {
    const apiSpy = vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/workspaces/ws-1/members') return { data: membersWs1 };
      if (url === '/api/workspaces/ws-1/invites') return { data: invitesWs1 };
      if (url === '/api/workspaces/ws-2/members') return { data: membersWs2 };
      if (url === '/api/workspaces/ws-2/invites') return { data: [] };
      return { data: [] };
    });

    render(<WorkspaceSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Bayu Anugerah's Workspace")).toBeInTheDocument();
    });

    // Open dropdown
    const trigger = screen.getByTestId('workspace-settings-dropdown-trigger');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.click(trigger);

    // Click on ws-2 item
    const ws2Item = await screen.findByTestId('workspace-select-item-ws-2');
    fireEvent.click(ws2Item);

    // Selected workspace view updates locally
    await waitFor(() => {
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('The Boss')).toBeInTheDocument();
      expect(screen.getByText('Team Members (2)')).toBeInTheDocument();
    });

    // apiFetch was called for ws-2 members and invites
    expect(apiSpy).toHaveBeenCalledWith('/api/workspaces/ws-2/members');
    expect(apiSpy).toHaveBeenCalledWith('/api/workspaces/ws-2/invites');

    // Global activeWorkspace should remain ws-1 (local state only!)
    expect(useWorkspaceStore.getState().activeWorkspace?.id).toBe('ws-1');

    // In ws-2, user is 'member', so invite button should be disabled
    const inviteBtn = screen.getByTestId('invite-member-btn');
    expect(inviteBtn).toBeDisabled();
  });

  it('does not display a "Jadikan Workspace Aktif" button inside the dropdown menu', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/workspaces/ws-2/members') return { data: membersWs2 };
      if (url === '/api/workspaces/ws-2/invites') return { data: [] };
      return { data: [] };
    });

    render(<WorkspaceSettingsTab />);

    // Switch to ws-2
    const trigger = screen.getByTestId('workspace-settings-dropdown-trigger');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.click(trigger);

    const ws2Item = await screen.findByTestId('workspace-select-item-ws-2');
    fireEvent.click(ws2Item);

    await waitFor(() => {
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    });

    // Open dropdown again and confirm "Jadikan Workspace Aktif" is NOT present
    const triggerAgain = screen.getByTestId('workspace-settings-dropdown-trigger');
    fireEvent.pointerDown(triggerAgain, { button: 0 });
    fireEvent.click(triggerAgain);
    expect(screen.queryByTestId('set-as-active-workspace-btn')).toBeNull();
  });

  it('sends an invitation when owner/admin fills the invite form', async () => {
    const apiSpy = vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/workspaces/ws-1/members') return { data: membersWs1 };
      if (url === '/api/workspaces/ws-1/invites') return { data: invitesWs1 };
      return { data: {} };
    });

    render(<WorkspaceSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Bayu Anugerah's Workspace")).toBeInTheDocument();
    });

    // Open invite dialog
    fireEvent.click(screen.getByTestId('invite-member-btn'));

    expect(screen.getByRole('dialog', { name: /Invite Team Member/i })).toBeInTheDocument();

    // Fill email
    fireEvent.change(screen.getByTestId('invite-email-input'), {
      target: { value: 'colleague@example.com' },
    });

    // Submit
    fireEvent.click(screen.getByTestId('submit-invite-btn'));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith('/api/workspaces/ws-1/invites', {
        method: 'POST',
        body: JSON.stringify({
          email: 'colleague@example.com',
          role: 'member',
        }),
      });
      expect(toast.success).toHaveBeenCalledWith('Invitation sent to colleague@example.com');
    });
  });

  it('creates a new workspace from the dropdown dialog', async () => {
    const newWs: WorkspaceDTO = {
      id: 'ws-3',
      name: 'Product Design',
      slug: 'product-design',
      description: 'UI/UX team',
      owner_id: 'user-bayu',
      role: 'owner',
      created_at: '2026-11-24T00:00:00Z',
    };

    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/workspaces/ws-1/members') return { data: membersWs1 };
      if (url === '/api/workspaces/ws-1/invites') return { data: invitesWs1 };
      if (url === '/api/workspaces/ws-3/members') return { data: [] };
      if (url === '/api/workspaces/ws-3/invites') return { data: [] };
      return { data: [] };
    });

    const createWsSpy = vi.spyOn(useWorkspaceStore.getState(), 'createWorkspace').mockResolvedValue(newWs);

    render(<WorkspaceSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Bayu Anugerah's Workspace")).toBeInTheDocument();
    });

    // Open dropdown and click create workspace
    const trigger = screen.getByTestId('workspace-settings-dropdown-trigger');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.click(trigger);
    const createItem = await screen.findByTestId('create-workspace-menu-item');
    fireEvent.click(createItem);

    expect(screen.getByRole('dialog', { name: /Create Workspace/i })).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('create-ws-name-input'), {
      target: { value: 'Product Design' },
    });

    fireEvent.click(screen.getByTestId('submit-create-ws-btn'));

    await waitFor(() => {
      expect(createWsSpy).toHaveBeenCalledWith('Product Design', undefined);
      expect(toast.success).toHaveBeenCalledWith('Workspace "Product Design" created!');
    });
  });
});