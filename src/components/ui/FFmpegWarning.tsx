/**
 * FFmpegWarning Component
 *
 * Displays a warning modal when FFmpeg is not available on the system.
 * Provides installation instructions and links.
 */

import { useCallback, useId, useRef, useEffect, type KeyboardEvent } from 'react';
import { ModalShell } from './ModalShell';

// =============================================================================
// Types
// =============================================================================

export interface FFmpegWarningProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dismissed */
  onDismiss: () => void;
  /** Whether to allow dismissing (user may want to force install) */
  allowDismiss?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const FFMPEG_DOWNLOAD_URL = 'https://ffmpeg.org/download.html';
const FFMPEG_WINDOWS_URL = 'https://www.gyan.dev/ffmpeg/builds/';
const FFMPEG_MAC_HOMEBREW = 'brew install ffmpeg';
const FFMPEG_LINUX_APT = 'sudo apt install ffmpeg';

// =============================================================================
// Component
// =============================================================================

export function FFmpegWarning({
  isOpen,
  onDismiss,
  allowDismiss = true,
}: FFmpegWarningProps): JSX.Element | null {
  const titleId = useId();
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && allowDismiss) {
        onDismiss();
      }
    },
    [onDismiss, allowDismiss],
  );

  const handleBackdropClick = useCallback(() => {
    if (allowDismiss) {
      onDismiss();
    }
  }, [allowDismiss, onDismiss]);

  const handleOpenLink = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // ===========================================================================
  // Effects
  // ===========================================================================

  useEffect(() => {
    if (isOpen && dismissButtonRef.current) {
      dismissButtonRef.current.focus();
    }
  }, [isOpen]);

  // ===========================================================================
  // Render
  // ===========================================================================

  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      role="alertdialog"
      ariaLabelledBy={titleId}
      onRequestClose={handleBackdropClick}
      onKeyDown={handleKeyDown}
      overlayClassName="bg-surface-overlay backdrop-blur-sm"
      overlayTestId="ffmpeg-warning-backdrop"
      testId="ffmpeg-warning"
      widthClassName="max-w-lg"
      dialogClassName="rounded-lg border border-border-default bg-surface-elevated shadow-xl"
      header={
        <div className="flex items-start gap-4 px-6 pt-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-status-warning/20">
            <svg
              className="h-6 w-6 text-status-warning"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-text-primary">
              FFmpeg Not Found
            </h2>
            <p className="mt-1 break-words text-sm text-text-secondary [overflow-wrap:anywhere]">
              FFmpeg is required for video processing, preview, and export.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            className="rounded bg-surface-active px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-highest"
            onClick={() => handleOpenLink(FFMPEG_DOWNLOAD_URL)}
          >
            Official Download
          </button>
          {allowDismiss && (
            <button
              ref={dismissButtonRef}
              data-testid="ffmpeg-warning-dismiss"
              type="button"
              className="rounded bg-status-warning px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-110"
              onClick={onDismiss}
            >
              Continue Anyway
            </button>
          )}
        </div>
      }
    >
      <div className="break-words px-6 py-4 [overflow-wrap:anywhere]">
        <div className="rounded-lg bg-surface-base p-4">
          <h3 className="mb-3 text-sm font-medium text-text-secondary">
            Installation Instructions
          </h3>

          <div className="mb-3 min-w-0">
            <div className="mb-1 flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Windows:</span>
            </div>
            <ol className="ml-2 list-inside list-decimal space-y-1 text-xs text-text-secondary">
              <li>
                Download from{' '}
                <button
                  type="button"
                  className="break-all text-primary-400 underline hover:text-primary-300"
                  onClick={() => handleOpenLink(FFMPEG_WINDOWS_URL)}
                >
                  gyan.dev/ffmpeg/builds
                </button>
              </li>
              <li>Extract to a folder (e.g., C:\ffmpeg)</li>
              <li>Add the bin folder to your system PATH</li>
            </ol>
          </div>

          <div className="mb-3">
            <div className="mb-1 flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">macOS:</span>
            </div>
            <code className="ml-2 block whitespace-pre-wrap break-all rounded bg-surface-active px-2 py-1 font-mono text-xs text-status-success">
              {FFMPEG_MAC_HOMEBREW}
            </code>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Linux (Debian/Ubuntu):</span>
            </div>
            <code className="ml-2 block whitespace-pre-wrap break-all rounded bg-surface-active px-2 py-1 font-mono text-xs text-status-success">
              {FFMPEG_LINUX_APT}
            </code>
          </div>
        </div>

        <p className="mt-4 text-xs text-text-muted">
          After installing FFmpeg, restart OpenReelio for changes to take effect.
        </p>
      </div>
    </ModalShell>
  );
}
