/**
 * ReasoningPartRenderer
 *
 * Renders LLM extended thinking / reasoning content.
 * Displayed as a collapsible block with dim styling.
 */

import { useState } from 'react';
import type { ReasoningPart } from '@/agents/engine/core/conversation';

interface ReasoningPartRendererProps {
  part: ReasoningPart;
  className?: string;
  diagnosticsEnabled?: boolean;
}

export function ReasoningPartRenderer({
  part,
  className = '',
  diagnosticsEnabled = true,
}: ReasoningPartRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!import.meta.env.DEV || !diagnosticsEnabled) {
    return null;
  }

  const preview = part.content.length > 120 ? part.content.slice(0, 120) + '...' : part.content;

  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-base/50 ${className}`}
      data-testid="reasoning-part"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-elevated transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="text-xs text-text-tertiary">{isExpanded ? '\u25BC' : '\u25B6'}</span>
        <span className="text-xs font-medium text-text-tertiary">Reasoning</span>
        {!isExpanded && (
          <span className="text-xs text-text-tertiary/60 truncate flex-1">{preview}</span>
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 border-t border-border-subtle">
          <p className="mt-1.5 max-w-full whitespace-pre-wrap break-words text-xs leading-relaxed text-text-tertiary [overflow-wrap:anywhere]">
            {part.content}
          </p>
        </div>
      )}
    </div>
  );
}
