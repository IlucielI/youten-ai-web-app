'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Gauge,
  Scroll,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/time';
import { usePlayerStore } from '@/stores/player.store';
import { Button } from '@/components/atoms/button';
import { Slider } from '@/components/atoms/slider';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/atoms/dropdown-menu';

export interface AudioPlayerProps {
  src?: string;
  title?: string;
  waveformPeaks?: number[];
  className?: string;
  sticky?: boolean;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0] as const;

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  waveformPeaks,
  className,
  sticky = true,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  // Zustand Player State
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const isAutoScrollEnabled = usePlayerStore((state) => state.isAutoScrollEnabled);

  // Store actions
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const setPlaybackRate = usePlayerStore((state) => state.setPlaybackRate);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const toggleAutoScroll = usePlayerStore((state) => state.toggleAutoScroll);
  const seek = usePlayerStore((state) => state.seek);
  const skipForward = usePlayerStore((state) => state.skipForward);
  const skipBackward = usePlayerStore((state) => state.skipBackward);

  // Scrubber hover state
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  // Generate synthetic waveform peaks if none provided
  const peaks = useMemo(() => {
    if (waveformPeaks && waveformPeaks.length > 0) return waveformPeaks;
    // Generate 64 visually pleasing pseudo-random peaks
    const generated: number[] = [];
    for (let i = 0; i < 64; i++) {
      const val = 0.2 + 0.7 * Math.abs(Math.sin((i / 64) * Math.PI * 4) * Math.cos(i * 0.4));
      generated.push(Math.min(1, Math.max(0.15, val)));
    }
    return generated;
  }, [waveformPeaks]);

  // Sync audio playbackRate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync audio volume & muted state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync external seek (when user clicks word in karaoke, for example)
  useEffect(() => {
    if (audioRef.current && !isSeeking) {
      const diff = Math.abs(audioRef.current.currentTime - currentTime);
      if (diff > 0.3) {
        audioRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, isSeeking]);

  // Handle HTML5 Audio events
  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (Number.isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSkip = (seconds: number) => {
    if (seconds > 0) {
      skipForward(seconds);
    } else {
      skipBackward(Math.abs(seconds));
    }
    if (audioRef.current) {
      audioRef.current.currentTime = usePlayerStore.getState().currentTime;
    }
  };

  // Scrubber click & drag interaction
  const calculateScrubberTime = (e: React.MouseEvent<HTMLDivElement>): number => {
    if (!scrubberRef.current) return 0;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = rect.width > 0 ? clickX / rect.width : 0;
    return ratio * (duration || 0);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetTime = calculateScrubberTime(e);
    seek(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetTime = calculateScrubberTime(e);
    setHoverPosition(targetTime);
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
    setIsSeeking(false);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      data-testid="audio-player-container"
      className={cn(
        'w-full max-w-4xl mx-auto rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-lg p-3 md:p-4 transition-all duration-300',
        sticky && 'sticky bottom-4 z-40',
        className
      )}
    >
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={src}
        data-testid="native-audio"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Title if provided */}
      {title && (
        <div className="text-xs font-semibold text-muted-foreground mb-1 truncate px-1">
          {title}
        </div>
      )}

      {/* Waveform Scrubber & Timestamps */}
      <div className="flex items-center gap-3">
        <span
          data-testid="current-time-display"
          className="text-xs font-mono font-medium text-foreground w-12 text-right select-none"
        >
          {formatTime(currentTime)}
        </span>

        {/* Interactive Waveform Container */}
        <div
          ref={scrubberRef}
          data-testid="waveform-scrubber"
          onClick={handleScrubberClick}
          onMouseDown={() => setIsSeeking(true)}
          onMouseUp={() => setIsSeeking(false)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative flex-1 h-12 flex items-center cursor-pointer group py-2"
        >
          {/* Waveform Bars */}
          <div className="w-full h-full flex items-center justify-between gap-[2px]">
            {peaks.map((peak, idx) => {
              const barProgress = (idx / peaks.length) * 100;
              const isPlayed = barProgress <= progressPercent;

              return (
                <div
                  key={idx}
                  style={{ height: `${Math.max(15, peak * 100)}%` }}
                  className={cn(
                    'flex-1 rounded-full transition-colors duration-150',
                    isPlayed
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/40'
                  )}
                />
              );
            })}
          </div>

          {/* Hover Time Tooltip */}
          {hoverPosition !== null && duration > 0 && (
            <div
              style={{
                left: `${Math.max(0, Math.min(100, (hoverPosition / duration) * 100))}%`,
              }}
              className="absolute -top-7 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shadow-md border border-border pointer-events-none select-none z-10"
            >
              {formatTime(hoverPosition)}
            </div>
          )}
        </div>

        <span
          data-testid="duration-display"
          className="text-xs font-mono font-medium text-muted-foreground w-12 select-none"
        >
          {formatTime(duration)}
        </span>
      </div>

      {/* Floating Toolbar Controls */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 gap-2">
        {/* Left Side: Auto-scroll toggle */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={isAutoScrollEnabled ? 'secondary' : 'ghost'}
            size="sm"
            onClick={toggleAutoScroll}
            title={isAutoScrollEnabled ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
            className={cn(
              'h-8 px-2 text-xs gap-1.5',
              isAutoScrollEnabled ? 'text-primary font-medium' : 'text-muted-foreground'
            )}
          >
            <Scroll className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-scroll</span>
          </Button>
        </div>

        {/* Center: Primary Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Skip -10s */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleSkip(-10)}
            title="Skip backward 10s"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* Play/Pause Button */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            data-testid="play-pause-button"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="h-10 w-10 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 bg-primary text-primary-foreground"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </Button>

          {/* Skip +10s */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleSkip(10)}
            title="Skip forward 10s"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Right Side: Speed Selector & Volume Control */}
        <div className="flex items-center gap-2">
          {/* Speed Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="speed-dropdown-trigger"
                className="h-8 px-2 text-xs gap-1 font-mono text-muted-foreground hover:text-foreground"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{playbackRate}x</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-24">
              {SPEED_OPTIONS.map((speed) => (
                <DropdownMenuItem
                  key={speed}
                  onClick={() => setPlaybackRate(speed)}
                  className={cn(
                    'font-mono text-xs cursor-pointer',
                    playbackRate === speed && 'font-bold text-primary'
                  )}
                >
                  {speed}x
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              data-testid="mute-toggle-button"
              title={isMuted ? 'Unmute' : 'Mute'}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>

            <div className="w-16 hidden sm:block">
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                min={0}
                max={100}
                step={1}
                aria-label="Volume"
                onValueChange={(val) => {
                  const newVol = (val[0] ?? 100) / 100;
                  setVolume(newVol);
                }}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
