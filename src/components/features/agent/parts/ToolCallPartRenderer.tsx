/**
 * ToolCallPartRenderer
 *
 * Renders tool invocation with name, args, and status.
 * Collapsed by default; expandable to show arguments.
 */

import { useState } from 'react';
import { CheckCircle2, Circle, LoaderCircle, XCircle } from 'lucide-react';
import type { ToolCallPart } from '@/agents/engine/core/conversation';

interface ToolCallPartRendererProps {
  part: ToolCallPart;
  className?: string;
  diagnosticsEnabled?: boolean;
}

const statusConfig: Record<
  ToolCallPart['status'],
  { label: string; color: string; icon: typeof Circle }
> = {
  pending: { label: 'Pending', color: 'text-text-tertiary', icon: Circle },
  running: { label: 'Running', color: 'text-primary-400', icon: LoaderCircle },
  completed: { label: 'Done', color: 'text-green-400', icon: CheckCircle2 },
  failed: { label: 'Issue', color: 'text-yellow-400', icon: XCircle },
};

const userStatusLabels: Record<ToolCallPart['status'], string> = {
  pending: 'Action queued',
  running: 'Working...',
  completed: 'Action completed',
  failed: 'Action needs attention',
};

export function ToolCallPartRenderer({
  part,
  className = '',
  diagnosticsEnabled = true,
}: ToolCallPartRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = statusConfig[part.status];
  const StatusIcon = status.icon;
  const showDiagnostics = import.meta.env.DEV && diagnosticsEnabled;

  if (!showDiagnostics) {
    return (
      <div
        className={`flex min-w-0 max-w-full items-center gap-2 rounded-lg px-3 py-1.5 ${className}`}
        data-testid="tool-call-part"
        role="status"
      >
        <StatusIcon
          className={`h-3.5 w-3.5 shrink-0 ${status.color} ${
            part.status === 'running' ? 'animate-spin' : ''
          }`}
          aria-hidden="true"
        />
        <span className="min-w-0 break-words text-xs text-text-secondary [overflow-wrap:anywhere]">
          {userStatusLabels[part.status]}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden rounded-lg border border-border-subtle ${className}`}
      data-testid="tool-call-part"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-elevated transition-colors"
        aria-expanded={isExpanded}
      >
        <span className={`inline-flex shrink-0 items-center gap-1 text-[11px] ${status.color}`}>
          <StatusIcon
            className={`h-3.5 w-3.5 ${part.status === 'running' ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {status.label}
        </span>
        <span className="min-w-0 truncate font-mono text-xs text-text-secondary">{part.tool}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-text-tertiary">
          {part.description}
        </span>
        {part.status === 'running' && (
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 border-t border-border-subtle">
          <pre className="mt-1.5 max-w-full overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-text-tertiary [overflow-wrap:anywhere]">
            {JSON.stringify(part.args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
