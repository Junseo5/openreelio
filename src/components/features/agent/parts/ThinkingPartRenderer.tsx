/**
 * ThinkingPartRenderer
 *
 * Renders the Think phase output as a collapsible section
 * showing understanding, approach, requirements, and uncertainties.
 */

import { useState } from 'react';
import type { ThinkingPart } from '@/agents/engine/core/conversation';

interface ThinkingPartRendererProps {
  part: ThinkingPart;
  className?: string;
  diagnosticsEnabled?: boolean;
}

export function ThinkingPartRenderer({
  part,
  className = '',
  diagnosticsEnabled = true,
}: ThinkingPartRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { thought } = part;

  if (!import.meta.env.DEV || !diagnosticsEnabled) {
    return null;
  }

  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden rounded-lg border border-border-subtle ${className}`}
      data-testid="thinking-part"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-elevated transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="text-xs text-text-tertiary">{isExpanded ? '\u25BC' : '\u25B6'}</span>
        <span className="text-xs font-medium text-text-secondary">Thinking</span>
        <span className="text-xs text-text-tertiary ml-auto">
          {thought.requirements.length} requirements
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border-subtle">
          <div className="mt-2">
            <div className="text-xs font-medium text-text-tertiary mb-1">Understanding</div>
            <p className="max-w-full break-words text-sm text-text-primary [overflow-wrap:anywhere]">
              {thought.understanding}
            </p>
          </div>

          <div>
            <div className="text-xs font-medium text-text-tertiary mb-1">Approach</div>
            <p className="max-w-full break-words text-sm text-text-primary [overflow-wrap:anywhere]">
              {thought.approach}
            </p>
          </div>

          {thought.needsMoreInfo && thought.clarificationQuestion && (
            <div className="p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-xs font-medium text-yellow-300 mb-1">Clarification Needed</div>
              <p className="max-w-full break-words text-sm text-yellow-200 [overflow-wrap:anywhere]">
                {thought.clarificationQuestion}
              </p>
            </div>
          )}

          {thought.requirements.length > 0 && (
            <div>
              <div className="text-xs font-medium text-text-tertiary mb-1">Requirements</div>
              <ul className="space-y-0.5">
                {thought.requirements.map((req, i) => (
                  <li
                    key={i}
                    className="flex min-w-0 max-w-full gap-2 break-words text-sm text-text-secondary [overflow-wrap:anywhere]"
                  >
                    <span className="text-text-tertiary">-</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {thought.uncertainties.length > 0 && (
            <div>
              <div className="text-xs font-medium text-yellow-400 mb-1">Uncertainties</div>
              <ul className="space-y-0.5">
                {thought.uncertainties.map((unc, i) => (
                  <li
                    key={i}
                    className="flex min-w-0 max-w-full gap-2 break-words text-sm text-yellow-300 [overflow-wrap:anywhere]"
                  >
                    <span>?</span>
                    {unc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
