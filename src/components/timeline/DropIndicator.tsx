/**
 * DropIndicator Component
 *
 * Visual indicator for clip drop position on the timeline.
 * Shows a vertical line at the drop position with:
 * - Time tooltip showing the drop position in timecode
 * - Color coding: blue for valid, red for invalid drops
 * - Error message for invalid drop reasons
 */

import { memo, useLayoutEffect, useRef, useState } from 'react';
import { formatDuration } from '@/utils/formatters';
import type { DropValidity } from '@/utils/dropValidity';
import { getClampedTooltipPosition } from './dropIndicatorPosition';

// =============================================================================
// Types
// =============================================================================

export interface DropIndicatorProps {
  /** Horizontal position in pixels */
  position: number;
  /** Drop validity result */
  validity: DropValidity;
  /** Time in seconds at the drop position */
  time: number;
  /** Track height in pixels (for vertical line height) */
  trackHeight?: number;
  /** Whether to show the time tooltip */
  showTimeTooltip?: boolean;
  /** Whether to show the error message */
  showErrorMessage?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export const DropIndicator = memo(function DropIndicator({
  position,
  validity,
  time,
  trackHeight = 64,
  showTimeTooltip = true,
  showErrorMessage = true,
}: DropIndicatorProps): JSX.Element {
  const isValid = validity.isValid;
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState(() => Math.max(0, position));

  useLayoutEffect(() => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!showTimeTooltip || !container || !tooltip) {
      return;
    }

    const updateTooltipPosition = () => {
      const nextPosition = getClampedTooltipPosition(
        position,
        container.getBoundingClientRect().width,
        tooltip.getBoundingClientRect().width,
      );
      setTooltipPosition((currentPosition) =>
        currentPosition === nextPosition ? currentPosition : nextPosition,
      );
    };

    updateTooltipPosition();
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateTooltipPosition);
    resizeObserver?.observe(container);
    resizeObserver?.observe(tooltip);
    window.addEventListener('resize', updateTooltipPosition);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateTooltipPosition);
    };
  }, [position, showTimeTooltip]);

  // Color classes based on validity
  const lineColorClass = isValid ? 'bg-blue-500' : 'bg-red-500';
  const glowClass = isValid
    ? 'shadow-[0_0_8px_rgba(59,130,246,0.6)]'
    : 'shadow-[0_0_8px_rgba(239,68,68,0.6)]';
  const tooltipBgClass = isValid ? 'bg-blue-600' : 'bg-red-600';

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-0 top-0 z-50"
      style={{ height: `${trackHeight}px` }}
    >
      <div
        data-testid="drop-indicator"
        data-valid={isValid}
        className="pointer-events-none absolute top-0 transition-all duration-100"
        style={{
          left: `${position}px`,
          height: `${trackHeight}px`,
        }}
      >
        {/* Main indicator line */}
        <div
          className={`absolute inset-y-0 w-0.5 ${lineColorClass} ${glowClass}`}
          style={{ left: '-1px' }}
        />

        {/* Diamond marker at top */}
        <div
          className={`absolute -top-1 h-2 w-2 rotate-45 ${lineColorClass}`}
          style={{ left: '-4px' }}
        />

        {/* Diamond marker at bottom */}
        <div
          className={`absolute -bottom-1 h-2 w-2 rotate-45 ${lineColorClass}`}
          style={{ left: '-4px' }}
        />

        {/* Glow effect gradient */}
        <div
          className={`absolute inset-y-0 w-px ${
            isValid
              ? 'bg-gradient-to-b from-blue-400/0 via-blue-400/50 to-blue-400/0'
              : 'bg-gradient-to-b from-red-400/0 via-red-400/50 to-red-400/0'
          }`}
          style={{ left: '-0.5px' }}
        />
      </div>

      {/* Clamp tooltips to the full track instead of the zero-width indicator line. */}
      {showTimeTooltip && (
        <div
          ref={tooltipRef}
          data-testid="drop-indicator-time"
          className={`absolute -top-8 box-border max-w-full -translate-x-1/2 overflow-hidden text-ellipsis whitespace-nowrap rounded px-2 py-1 font-mono text-xs text-white ${tooltipBgClass}`}
          style={{ left: `${tooltipPosition}px` }}
        >
          {formatDuration(time)}
        </div>
      )}

      {/* Center feedback independently from the exact drop line so narrow tracks cannot invert bounds. */}
      {showErrorMessage && !isValid && validity.message && (
        <div className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-center">
          <div
            data-testid="drop-indicator-error"
            className="w-max max-w-full whitespace-normal break-words rounded bg-red-600 px-2 py-1 text-xs text-white shadow-lg"
          >
            {validity.message}
          </div>
        </div>
      )}
    </div>
  );
});
