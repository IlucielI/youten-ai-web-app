import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FolderSidebar } from './FolderSidebar';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { FolderDTO } from '@/server/dtos/workspace.dto';

describe('FolderSidebar Component', () => {
  const mockFolders: FolderDTO[] = [
    {
      id: 'f-1',
      workspace_id: 'ws-1',
      name: 'Engineering',
      recordings_count: 5,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'f-2',
      workspace_id: 'ws-1',
      name: 'Design',
      recordings_count: 0,
      created_at: '2026-10-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    useWorkspaceStore.setState({
      folders: mockFolders,
      activeFolderId: null,
      fetchFolders: vi.fn().mockResolvedValue(mockFolders),
    });
  });

  it('renders all folders with their recordings count badges', () => {
    render(<FolderSidebar totalRecordingsCount={10} />);

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByTestId('folder-count-f-1')).toHaveTextContent('5');

    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByTestId('folder-count-f-2')).toHaveTextContent('0');

    expect(screen.getByText('All Recordings')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('handles folder selection', () => {
    const setActiveFolderId = vi.fn();
    useWorkspaceStore.setState({ setActiveFolderId });

    render(<FolderSidebar totalRecordingsCount={10} />);

    fireEvent.click(screen.getByText('Engineering'));
    expect(setActiveFolderId).toHaveBeenCalledWith('f-1');
  });
});
