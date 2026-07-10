/**
 * ConversationMessageItem
 *
 * Renders a single ConversationMessage by iterating its typed parts
 * and dispatching to the appropriate part renderer.
 *
 * - User messages: right-aligned, primary color
 * - Assistant messages: left-aligned, surface color, multi-part layout
 * - System messages: centered, muted
 */

import type { ConversationMessage, MessagePart } from '@/agents/engine/core/conversation';
import { TextPartRenderer } from './parts/TextPartRenderer';
import { ThinkingPartRenderer } from './parts/ThinkingPartRenderer';
import { ClarificationPartRenderer } from './parts/ClarificationPartRenderer';
import { PlanPartRenderer } from './parts/PlanPartRenderer';
import { ToolCallPartRenderer } from './parts/ToolCallPartRenderer';
import { ToolResultPartRenderer } from './parts/ToolResultPartRenderer';
import { ErrorPartRenderer } from './parts/ErrorPartRenderer';
import { ApprovalPartRenderer } from './parts/ApprovalPartRenderer';
import { ToolApprovalPartRenderer } from './parts/ToolApprovalPartRenderer';
import { ReasoningPartRenderer } from './parts/ReasoningPartRenderer';
import { CompactionPartRenderer } from './parts/CompactionPartRenderer';
import { PatchPartRenderer } from './parts/PatchPartRenderer';
import { AssistantArtifactGroup } from './AssistantArtifactGroup';

// =============================================================================
// Types
// =============================================================================

interface ConversationMessageItemProps {
  message: ConversationMessage;
  highlightArtifacts?: boolean;
  onApprove?: () => void;
  onReject?: (reason?: string) => void;
  onRetry?: () => void;
  onToolAllow?: () => void;
  onToolAllowAlways?: () => void;
  onToolDeny?: () => void;
  diagnosticsEnabled?: boolean;
  className?: string;
}

// =============================================================================
// Part Renderer Dispatch
// =============================================================================

interface PartCallbacks {
  onApprove?: () => void;
  onReject?: (reason?: string) => void;
  onRetry?: () => void;
  onToolAllow?: () => void;
  onToolAllowAlways?: () => void;
  onToolDeny?: () => void;
  diagnosticsEnabled: boolean;
}

function renderPart(part: MessagePart, index: number, callbacks: PartCallbacks): React.ReactNode {
  const key = `${part.type}-${index}`;

  switch (part.type) {
    case 'text':
      return <TextPartRenderer key={key} part={part} />;
    case 'thinking':
      return (
        <ThinkingPartRenderer
          key={key}
          part={part}
          diagnosticsEnabled={callbacks.diagnosticsEnabled}
        />
      );
    case 'clarification':
      return <ClarificationPartRenderer key={key} part={part} />;
    case 'plan':
      return (
        <PlanPartRenderer
          key={key}
          part={part}
          onApprove={callbacks.onApprove}
          onReject={callbacks.onReject}
        />
      );
    case 'tool_call':
      return (
        <ToolCallPartRenderer
          key={key}
          part={part}
          diagnosticsEnabled={callbacks.diagnosticsEnabled}
        />
      );
    case 'tool_result':
      return (
        <ToolResultPartRenderer
          key={key}
          part={part}
          diagnosticsEnabled={callbacks.diagnosticsEnabled}
        />
      );
    case 'error':
      return (
        <ErrorPartRenderer
          key={key}
          part={part}
          onRetry={callbacks.onRetry}
          diagnosticsEnabled={callbacks.diagnosticsEnabled}
        />
      );
    case 'approval':
      return (
        <ApprovalPartRenderer
          key={key}
          part={part}
          onApprove={callbacks.onApprove}
          onReject={callbacks.onReject}
        />
      );
    case 'tool_approval':
      return (
        <ToolApprovalPartRenderer
          key={key}
          part={part}
          onAllow={callbacks.onToolAllow}
          onAllowAlways={callbacks.onToolAllowAlways}
          onDeny={callbacks.onToolDeny}
        />
      );
    case 'reasoning':
      return (
        <ReasoningPartRenderer
          key={key}
          part={part}
          diagnosticsEnabled={callbacks.diagnosticsEnabled}
        />
      );
    case 'compaction':
      return <CompactionPartRenderer key={key} part={part} />;
    case 'patch':
      return <PatchPartRenderer key={key} part={part} />;
    default:
      return null;
  }
}

function isArtifactPart(part: MessagePart): boolean {
  return (
    part.type === 'tool_call' ||
    part.type === 'tool_result' ||
    part.type === 'patch' ||
    part.type === 'compaction'
  );
}

// =============================================================================
// Component
// =============================================================================

export function ConversationMessageItem({
  message,
  highlightArtifacts = false,
  onApprove,
  onReject,
  onRetry,
  onToolAllow,
  onToolAllowAlways,
  onToolDeny,
  diagnosticsEnabled = true,
  className = '',
}: ConversationMessageItemProps) {
  const showDiagnostics = import.meta.env.DEV && diagnosticsEnabled;
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // User messages: right-aligned bubble
  if (isUser) {
    const textContent = message.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { content: string }).content)
      .join('\n');

    return (
      <div className={`flex justify-end ${className}`} data-testid="conversation-message-user">
        <div className="min-w-0 max-w-[86%] overflow-hidden rounded-lg border border-primary-500/20 bg-primary-600/15 px-3 py-2 text-text-primary">
          <p className="max-w-full whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">
            {textContent}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs opacity-60 block">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            {message.persistenceStatus === 'failed' && (
              <span
                className="text-xs text-red-300 opacity-70"
                title="Message could not be saved"
                data-testid="persistence-failed-indicator"
              >
                (not saved)
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // System messages: centered, muted
  if (isSystem) {
    const textContent = message.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { content: string }).content)
      .join('\n');

    return (
      <div className={`flex justify-center ${className}`} data-testid="conversation-message-system">
        <div className="mx-auto w-full min-w-0 max-w-sm overflow-hidden rounded-md border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-center text-yellow-400">
          <p className="max-w-full whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">
            {textContent}
          </p>
        </div>
      </div>
    );
  }

  // Assistant messages: left-aligned, multi-part layout
  const inlineParts = message.parts
    .map((part, index) => ({ part, index }))
    .filter(({ part }) => !isArtifactPart(part));
  const artifactParts = message.parts
    .map((part, index) => ({ part, index }))
    .filter(({ part }) => isArtifactPart(part));
  const completedToolStepIds = new Set(
    artifactParts.flatMap(({ part }) => (part.type === 'tool_result' ? [part.stepId] : [])),
  );
  const renderedArtifactParts = showDiagnostics
    ? artifactParts
    : artifactParts.filter(
        ({ part }) => part.type !== 'tool_call' || !completedToolStepIds.has(part.stepId),
      );
  const toolCallCount = artifactParts.filter(({ part }) => part.type === 'tool_call').length;
  const toolResultCount = artifactParts.filter(({ part }) => part.type === 'tool_result').length;
  const patchParts = artifactParts.filter(
    (entry): entry is { part: Extract<MessagePart, { type: 'patch' }>; index: number } =>
      entry.part.type === 'patch',
  );
  const patchPartCount = patchParts.length;
  const patchFileCount = patchParts.reduce((count, entry) => count + entry.part.files.length, 0);
  const hasCompaction = artifactParts.some(({ part }) => part.type === 'compaction');
  const hasRunningArtifacts = artifactParts.some(
    ({ part }) =>
      part.type === 'tool_call' && (part.status === 'pending' || part.status === 'running'),
  );
  const hasFailedArtifacts = artifactParts.some(
    ({ part }) =>
      (part.type === 'tool_call' && part.status === 'failed') ||
      (part.type === 'tool_result' && !part.success),
  );
  const hasErrorPart = message.parts.some((part) => part.type === 'error');

  return (
    <div className={`flex justify-start ${className}`} data-testid="conversation-message-assistant">
      <div className="w-full min-w-0 space-y-2">
        {inlineParts.map(({ part, index }) =>
          renderPart(part, index, {
            onApprove,
            onReject,
            onRetry,
            onToolAllow,
            onToolAllowAlways,
            onToolDeny,
            diagnosticsEnabled: showDiagnostics,
          }),
        )}
        {artifactParts.length > 0 && (
          <AssistantArtifactGroup
            toolCallCount={toolCallCount}
            toolResultCount={toolResultCount}
            patchPartCount={patchPartCount}
            patchFileCount={patchFileCount}
            hasCompaction={hasCompaction}
            hasRunningArtifacts={hasRunningArtifacts}
            hasFailedArtifacts={hasFailedArtifacts}
            hasError={hasErrorPart}
            defaultOpen={false}
            highlighted={highlightArtifacts}
          >
            {renderedArtifactParts.map(({ part, index }) =>
              renderPart(part, index, {
                onApprove,
                onReject,
                onRetry,
                onToolAllow,
                onToolAllowAlways,
                onToolDeny,
                diagnosticsEnabled: showDiagnostics,
              }),
            )}
          </AssistantArtifactGroup>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary block">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.persistenceStatus === 'failed' && (
            <span
              className="text-xs text-red-400 opacity-70"
              title="Message could not be saved"
              data-testid="persistence-failed-indicator"
            >
              (not saved)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
