import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceChatDrawer } from './WorkspaceChatDrawer';
import { useWorkspaceChatStore } from '@/stores/workspace-chat.store';

describe('WorkspaceChatDrawer', () => {
  beforeEach(() => {
    useWorkspaceChatStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<WorkspaceChatDrawer />);
    expect(screen.queryByRole('dialog', { name: /Workspace AI Chat/i })).toBeNull();
  });

  it('should render when open with starter prompts when no messages', () => {
    useWorkspaceChatStore.getState().openDrawer({ type: 'workspace' });

    render(<WorkspaceChatDrawer />);
    expect(screen.getByRole('dialog', { name: /Workspace AI Chat/i })).toBeDefined();
    expect(screen.getByText(/Multi-Meeting Intelligence/i)).toBeDefined();
    expect(screen.getByText(/What action items were assigned across these meetings\?/i)).toBeDefined();
  });

  it('should close when close button is clicked', () => {
    useWorkspaceChatStore.getState().openDrawer({ type: 'workspace' });

    render(<WorkspaceChatDrawer />);
    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);

    expect(useWorkspaceChatStore.getState().isOpen).toBe(false);
  });
});

