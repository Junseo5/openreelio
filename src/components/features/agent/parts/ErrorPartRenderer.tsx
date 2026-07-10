/**
 * ErrorPartRenderer
 *
 * Renders error messages with optional retry button.
 */

import type { ErrorPart } from '@/agents/engine/core/conversation';
import { getUserFriendlyError } from '@/utils/errorMessages';

interface ErrorPartRendererProps {
  part: ErrorPart;
  onRetry?: () => void;
  className?: string;
  diagnosticsEnabled?: boolean;
}

export function ErrorPartRenderer({
  part,
  onRetry,
  className = '',
  diagnosticsEnabled = true,
}: ErrorPartRendererProps) {
  const showDiagnostics = import.meta.env.DEV && diagnosticsEnabled;
  const displayMessage = showDiagnostics
    ? part.message
    : getUserFriendlyError(part.message, { includeTechnicalDetails: false });

  return (
    <div
      className={`min-w-0 max-w-full rounded-lg border border-red-500/20 bg-red-500/10 p-3 ${className}`}
      data-testid="error-part"
    >
      <div className="flex items-start gap-2">
        <span className="text-red-400 text-sm mt-0.5">\u26A0</span>
        <div className="flex-1 min-w-0">
          <p className="max-w-full break-words text-sm text-red-400 [overflow-wrap:anywhere]">
            {displayMessage}
          </p>
          {showDiagnostics && (
            <div className="mt-1 flex min-w-0 max-w-full flex-wrap items-center gap-2">
              <span className="max-w-full break-all font-mono text-xs text-red-400/60">
                {part.code}
              </span>
              <span className="max-w-full break-words text-xs text-red-400/60 [overflow-wrap:anywhere]">
                in {part.phase}
              </span>
            </div>
          )}
        </div>
      </div>

      {part.recoverable && onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
          data-testid="error-retry-btn"
        >
          Retry
        </button>
      )}
    </div>
  );
}
