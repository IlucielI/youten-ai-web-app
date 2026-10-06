import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatPanel } from './ChatPanel';
import { useChatStore } from '@/stores/chat.store';
import { usePlayerStore } from '@/stores/player.store';

describe('ChatPanel Organism', () => {
  beforeEach(() => {
    useChatStore.getState().clearChat();
    usePlayerStore.getState().seek(0);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ChatPanel isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty state with quick prompt chips when no messages exist', () => {
    render(<ChatPanel isOpen={true} />);

    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.getByTestId('chat-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('chat-chips')).toBeInTheDocument();
  });

  it('allows user to type a message and submit it', async () => {
    const handleSend = vi.fn();
    render(<ChatPanel isOpen={true} onSendMessage={handleSend} />);

    const textarea = screen.getByTestId('chat-input-textarea');
    fireEvent.change(textarea, { target: { value: 'Berapa durasi rapat?' } });

    const sendBtn = screen.getByTestId('send-chat-btn');
    fireEvent.click(sendBtn);

    expect(handleSend).toHaveBeenCalledWith('Berapa durasi rapat?');
    expect(useChatStore.getState().messages.length).toBe(1);
    expect(useChatStore.getState().messages[0].content).toBe('Berapa durasi rapat?');
  });

  it('parses inline [MM:SS] timestamps in assistant messages into clickable citation badges', () => {
    // Populate store with assistant message containing timestamp
    act(() => {
      useChatStore.setState({
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Diskusi tentang anggaran dimulai pada [02:30] dan disetujui.',
            timestamp: new Date().toISOString(),
          },
        ],
      });
    });

    render(<ChatPanel isOpen={true} />);

    expect(screen.getByTestId('citation-badge')).toBeInTheDocument();
    expect(screen.getByText('[02:30]')).toBeInTheDocument();

    // Clicking badge seeks player store to 150 seconds (02:30)
    fireEvent.click(screen.getByTestId('citation-badge'));
    expect(usePlayerStore.getState().currentTime).toBe(150);
  });

  it('renders streaming indicator when isStreaming is true', () => {
    act(() => {
      useChatStore.setState({
        isStreaming: true,
        streamingContent: 'Sedang menganalisis transkrip...',
      });
    });

    render(<ChatPanel isOpen={true} />);

    expect(screen.getByTestId('chat-streaming-indicator')).toBeInTheDocument();
    expect(screen.getByText(/Sedang menganalisis transkrip/)).toBeInTheDocument();
  });

  it('clears chat messages when clear chat button is clicked', () => {
    act(() => {
      useChatStore.setState({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Pertanyaan',
            timestamp: new Date().toISOString(),
          },
        ],
      });
    });

    render(<ChatPanel isOpen={true} />);

    const clearBtn = screen.getByTestId('clear-chat-btn');
    fireEvent.click(clearBtn);

    expect(useChatStore.getState().messages.length).toBe(0);
  });

  it('renders markdown formatting like bold text and timestamp range citations correctly', () => {
    act(() => {
      useChatStore.setState({
        messages: [
          {
            id: 'msg-rag-1',
            role: 'assistant',
            content: 'Game Boy dibuat di **Jepang**. [01:06 - 01:24]',
            timestamp: new Date().toISOString(),
          },
        ],
      });
    });

    render(<ChatPanel isOpen={true} />);

    // Bold text is rendered as strong element
    const boldEl = screen.getByText('Jepang');
    expect(boldEl.tagName.toLowerCase()).toBe('strong');

    // Range citation badge is rendered and clickable
    expect(screen.getByTestId('citation-badge')).toBeInTheDocument();
    expect(screen.getByText('[01:06 - 01:24]')).toBeInTheDocument();

    // Clicking seeks to start timestamp (01:06 = 66 seconds)
    fireEvent.click(screen.getByTestId('citation-badge'));
    expect(usePlayerStore.getState().currentTime).toBe(66);
  });
});
