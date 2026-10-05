import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  activeSegmentId: string | null;
  activeWordIndex: number | null;
  isAutoScrollEnabled: boolean;
  audioUrl: string | null;
}

export interface PlayerActions {
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setIsMuted: (isMuted: boolean) => void;
  setActiveSegment: (segmentId: string | null, wordIndex?: number | null) => void;
  toggleAutoScroll: () => void;
  setAutoScrollEnabled: (enabled: boolean) => void;
  setAudioUrl: (url: string | null) => void;
  seek: (time: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  resetPlayer: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;

const initialPlayerState: PlayerState = {
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackRate: 1.0,
  volume: 1.0,
  isMuted: false,
  activeSegmentId: null,
  activeWordIndex: null,
  isAutoScrollEnabled: true,
  audioUrl: null,
};

export const usePlayerStore = create<PlayerStore>()(
  devtools(
    (set, get) => ({
      ...initialPlayerState,

      setCurrentTime: (time: number) => {
        const clamped = Math.max(0, Math.min(get().duration || Infinity, time));
        set({ currentTime: clamped }, false, 'player/setCurrentTime');
      },

      setDuration: (duration: number) => {
        set({ duration: Math.max(0, duration) }, false, 'player/setDuration');
      },

      setIsPlaying: (isPlaying: boolean) => {
        set({ isPlaying }, false, 'player/setIsPlaying');
      },

      togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }), false, 'player/togglePlay');
      },

      setPlaybackRate: (rate: number) => {
        const clamped = Math.max(0.5, Math.min(3.0, rate));
        set({ playbackRate: clamped }, false, 'player/setPlaybackRate');
      },

      setVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1.0, volume));
        set({ volume: clamped, isMuted: clamped === 0 }, false, 'player/setVolume');
      },

      toggleMute: () => {
        set((state) => ({ isMuted: !state.isMuted }), false, 'player/toggleMute');
      },

      setIsMuted: (isMuted: boolean) => {
        set({ isMuted }, false, 'player/setIsMuted');
      },

      setActiveSegment: (segmentId: string | null, wordIndex: number | null = null) => {
        set({ activeSegmentId: segmentId, activeWordIndex: wordIndex }, false, 'player/setActiveSegment');
      },

      toggleAutoScroll: () => {
        set((state) => ({ isAutoScrollEnabled: !state.isAutoScrollEnabled }), false, 'player/toggleAutoScroll');
      },

      setAutoScrollEnabled: (enabled: boolean) => {
        set({ isAutoScrollEnabled: enabled }, false, 'player/setAutoScrollEnabled');
      },

      setAudioUrl: (url: string | null) => {
        set({ audioUrl: url }, false, 'player/setAudioUrl');
      },

      seek: (time: number) => {
        const clamped = Math.max(0, Math.min(get().duration || Infinity, time));
        set({ currentTime: clamped }, false, 'player/seek');
      },

      skipForward: (seconds = 10) => {
        const { currentTime, duration } = get();
        const nextTime = Math.min(duration || Infinity, currentTime + seconds);
        set({ currentTime: nextTime }, false, 'player/skipForward');
      },

      skipBackward: (seconds = 10) => {
        const { currentTime } = get();
        const nextTime = Math.max(0, currentTime - seconds);
        set({ currentTime: nextTime }, false, 'player/skipBackward');
      },

      resetPlayer: () => {
        set(initialPlayerState, false, 'player/resetPlayer');
      },
    }),
    { name: 'PlayerStore' }
  )
);
