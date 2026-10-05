import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ChatRole } from '../server/constants';
import { MeetingSourceCitationDTO } from '../server/dtos';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  citations?: MeetingSourceCitationDTO[];
  isStreaming?: boolean;
}

export interface ChatState {
  recordingId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  streamingCitations: MeetingSourceCitationDTO[];
  error: string | null;
}

export interface ChatActions {
  setRecordingId: (id: string | null) => void;
  addUserMessage: (content: string) => string;
  startAssistantStream: (id?: string) => string;
  appendStreamChunk: (chunk: string) => void;
  setStreamCitations: (citations: MeetingSourceCitationDTO[]) => void;
  finalizeAssistantMessage: (
    id: string,
    fullContent?: string,
    citations?: MeetingSourceCitationDTO[]
  ) => void;
  setChatError: (error: string | null) => void;
  clearChat: () => void;
}

export type ChatStore = ChatState & ChatActions;

const initialChatState: ChatState = {
  recordingId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  streamingCitations: [],
  error: null,
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      ...initialChatState,

      setRecordingId: (id: string | null) => {
        if (get().recordingId !== id) {
          set({ recordingId: id, messages: [], error: null }, false, 'chat/setRecordingId');
        }
      },

      addUserMessage: (content: string) => {
        const id = crypto.randomUUID();
        const userMsg: ChatMessage = {
          id,
          role: ChatRole.USER,
          content,
          timestamp: new Date().toISOString(),
        };

        set(
          (state) => ({
            messages: [...state.messages, userMsg],
            error: null,
          }),
          false,
          'chat/addUserMessage'
        );

        return id;
      },

      startAssistantStream: (id = crypto.randomUUID()) => {
        const streamMsg: ChatMessage = {
          id,
          role: ChatRole.ASSISTANT,
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true,
          citations: [],
        };

        set(
          (state) => ({
            isStreaming: true,
            streamingContent: '',
            streamingCitations: [],
            messages: [...state.messages, streamMsg],
            error: null,
          }),
          false,
          'chat/startAssistantStream'
        );

        return id;
      },

      appendStreamChunk: (chunk: string) => {
        const nextContent = get().streamingContent + chunk;
        set(
          (state) => ({
            streamingContent: nextContent,
            messages: state.messages.map((msg) =>
              msg.isStreaming ? { ...msg, content: nextContent } : msg
            ),
          }),
          false,
          'chat/appendStreamChunk'
        );
      },

      setStreamCitations: (citations: MeetingSourceCitationDTO[]) => {
        set(
          (state) => ({
            streamingCitations: citations,
            messages: state.messages.map((msg) =>
              msg.isStreaming ? { ...msg, citations } : msg
            ),
          }),
          false,
          'chat/setStreamCitations'
        );
      },

      finalizeAssistantMessage: (
        id: string,
        fullContent?: string,
        citations?: MeetingSourceCitationDTO[]
      ) => {
        const { streamingContent, streamingCitations } = get();
        const finalContent = fullContent !== undefined ? fullContent : streamingContent;
        const finalCitations = citations !== undefined ? citations : streamingCitations;

        set(
          (state) => ({
            isStreaming: false,
            streamingContent: '',
            streamingCitations: [],
            messages: state.messages.map((msg) =>
              msg.id === id
                ? {
                    ...msg,
                    content: finalContent,
                    citations: finalCitations,
                    isStreaming: false,
                  }
                : msg
            ),
          }),
          false,
          'chat/finalizeAssistantMessage'
        );
      },

      setChatError: (error: string | null) => {
        set({ error, isStreaming: false }, false, 'chat/setChatError');
      },

      clearChat: () => {
        set({ ...initialChatState, recordingId: get().recordingId }, false, 'chat/clearChat');
      },
    }),
    { name: 'ChatStore' }
  )
);
