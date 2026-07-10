import type { ReactNode } from 'react';

export interface AppFrameProps {
  /** Optional application-level banner that reserves space above the active screen. */
  banner?: ReactNode;
  /** The active application screen. */
  children: ReactNode;
  /** Additional classes for the outer application frame. */
  className?: string;
}

/**
 * Owns the viewport height for top-level application screens.
 *
 * Screens rendered inside this frame should use `h-full min-h-0` instead of
 * claiming another viewport height. This keeps banners and the active screen
 * within one viewport without clipping the bottom of the workspace.
 */
export function AppFrame({ banner, children, className = '' }: AppFrameProps): JSX.Element {
  return (
    <div
      className={`flex h-screen h-dvh min-h-0 flex-col overflow-hidden bg-editor-bg text-editor-text ${className}`}
      data-testid="app-frame"
    >
      {banner && (
        <div className="shrink-0" data-testid="app-frame-banner">
          {banner}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden" data-testid="app-frame-content">
        {children}
      </div>
    </div>
  );
}
