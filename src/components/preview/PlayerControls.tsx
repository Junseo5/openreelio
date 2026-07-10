/**
 * PlayerControls Component
 *
 * Video player control bar with play/pause, seek, volume, and fullscreen controls.
 * JKL shuttle is handled globally by useKeyboardShortcuts; shuttle speed is
 * passed as a prop from the parent container.
 */

import { useCallback, type KeyboardEvent } from 'react';
import { Columns2, Maximize, Minimize } from 'lucide-react';
import { SeekBar } from './SeekBar';
import { PlaybackButtons } from './PlaybackButtons';
import { VolumeControls } from './VolumeControls';
import { formatTimecode } from '@/utils/formatters';
import { ShuttleSpeedIndicator } from './ShuttleSpeedIndicator';
import { TimecodeInput } from '@/components/features/preview/TimecodeInput';
import './PlayerControls.css';

// =============================================================================
// Types
// =============================================================================

export interface PlayerControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  buffered?: number;
  isFullscreen?: boolean;
  disabled?: boolean;
  /** Frames per second for frame stepping (default: 30) */
  fps?: number;
  /** Current playback rate */
  playbackRate?: number;
  /** Current JKL shuttle speed (0 = inactive) */
  shuttleSpeed?: number;
  /** Whether color comparison overlay is active */
  isComparisonActive?: boolean;
  onPlayPause?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onMuteToggle?: () => void;
  onFullscreenToggle?: () => void;
  /** Callback for playback rate change */
  onPlaybackRateChange?: (rate: number) => void;
  /** Callback to toggle color comparison overlay */
  onToggleComparison?: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const VOLUME_STEP = 0.1;
const FAST_SEEK_STEP = 1; // For Shift+Arrow (1 second jump)
const DEFAULT_FPS = 30;

// Playback speed presets for the speed selector dropdown
const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4, 8] as const;

// =============================================================================
// Component
// =============================================================================

export function PlayerControls({
  currentTime,
  duration,
  isPlaying,
  volume,
  isMuted,
  buffered = 0,
  isFullscreen = false,
  disabled = false,
  fps = DEFAULT_FPS,
  playbackRate = 1,
  shuttleSpeed = 0,
  isComparisonActive = false,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onPlaybackRateChange,
  onToggleComparison,
}: PlayerControlsProps) {
  const frameTime = 1 / fps;

  const handleFullscreenToggle = useCallback(() => {
    if (!disabled) {
      onFullscreenToggle?.();
    }
  }, [disabled, onFullscreenToggle]);

  // Local keyboard handler for controls-specific shortcuts.
  // J/K/L shuttle is handled globally by useKeyboardShortcuts + useJKLShuttle.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onPlayPause?.();
          break;

        // Arrow keys: Shift = 1 sec jump, normal = frame step
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            onSeek?.(Math.min(duration, currentTime + FAST_SEEK_STEP));
          } else {
            onSeek?.(Math.min(duration, currentTime + frameTime));
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            onSeek?.(Math.max(0, currentTime - FAST_SEEK_STEP));
          } else {
            onSeek?.(Math.max(0, currentTime - frameTime));
          }
          break;

        // Frame stepping with . and ,
        case '.':
          e.preventDefault();
          onSeek?.(Math.min(duration, currentTime + frameTime));
          break;
        case ',':
          e.preventDefault();
          onSeek?.(Math.max(0, currentTime - frameTime));
          break;

        // Volume controls
        case 'ArrowUp':
          e.preventDefault();
          onVolumeChange?.(Math.min(1, volume + VOLUME_STEP));
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeChange?.(Math.max(0, volume - VOLUME_STEP));
          break;

        // Jump to start/end
        case 'Home':
          e.preventDefault();
          onSeek?.(0);
          break;
        case 'End':
          e.preventDefault();
          onSeek?.(duration);
          break;

        // Mute toggle
        case 'm':
        case 'M':
          e.preventDefault();
          onMuteToggle?.();
          break;

        // Fullscreen toggle
        case 'f':
        case 'F':
          e.preventDefault();
          onFullscreenToggle?.();
          break;
      }
    },
    [
      disabled,
      currentTime,
      duration,
      volume,
      frameTime,
      onPlayPause,
      onSeek,
      onVolumeChange,
      onMuteToggle,
      onFullscreenToggle,
    ],
  );

  return (
    <div
      data-testid="player-controls"
      className="player-controls-container flex w-full min-w-0 flex-col overflow-hidden bg-gradient-to-t from-black/80 to-transparent p-2 text-white"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Seek Bar */}
      <div className="mb-2 min-w-0">
        <SeekBar
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          onSeek={onSeek}
          disabled={disabled}
        />
      </div>

      {/* Controls Row */}
      <div className="player-controls-row flex min-w-0 items-center">
        <div className="shrink-0">
          <PlaybackButtons
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={onPlayPause}
            onSeek={onSeek}
            disabled={disabled}
          />
        </div>

        <div className="flex min-w-0 shrink items-center gap-1 overflow-hidden font-mono text-sm">
          <TimecodeInput
            currentTime={currentTime}
            duration={duration}
            fps={fps}
            onSeek={onSeek}
            disabled={disabled}
            className="max-w-full truncate whitespace-nowrap"
          />
          <span className="player-controls-duration shrink-0">/</span>
          <span
            data-testid="duration-display"
            className="player-controls-duration shrink-0 whitespace-nowrap"
          >
            {formatTimecode(duration, fps)}
          </span>
        </div>

        {/* Shuttle Speed Badge — visible only when shuttle is active */}
        <ShuttleSpeedIndicator
          shuttleSpeed={shuttleSpeed}
          className="player-controls-secondary static translate-x-0 px-1.5 py-0.5 text-[10px]"
        />

        <div className="min-w-0 flex-1" />

        <div className="shrink-0">
          <VolumeControls
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={onVolumeChange}
            onMuteToggle={onMuteToggle}
            disabled={disabled}
            sliderClassName="player-controls-volume-slider"
          />
        </div>

        {/* Playback Speed Selector */}
        <select
          data-testid="speed-selector"
          className="player-controls-speed shrink-0 cursor-pointer rounded border border-white/20 bg-transparent px-1 py-0.5 text-xs text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
          value={playbackRate.toString()}
          onChange={(e) => onPlaybackRateChange?.(parseFloat(e.target.value))}
          disabled={disabled}
          aria-label="Playback speed"
        >
          {SPEED_PRESETS.map((speed) => (
            <option key={speed} value={speed.toString()} className="bg-gray-800">
              {speed}x
            </option>
          ))}
        </select>

        {onToggleComparison && (
          <button
            data-testid="comparison-toggle-button"
            type="button"
            className={`player-controls-comparison shrink-0 rounded p-1.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${
              isComparisonActive ? 'bg-blue-500/40 text-blue-300' : ''
            }`}
            onClick={onToggleComparison}
            disabled={disabled}
            aria-label="Toggle color comparison"
            aria-pressed={isComparisonActive}
            title="Before/After Comparison (Shift+D)"
          >
            <Columns2 className="w-4 h-4" />
          </button>
        )}

        <button
          data-testid="fullscreen-button"
          type="button"
          className="shrink-0 rounded p-1.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleFullscreenToggle}
          disabled={disabled}
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? (
            <Minimize data-testid="fullscreen-exit-icon" className="w-4 h-4" />
          ) : (
            <Maximize data-testid="fullscreen-enter-icon" className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
