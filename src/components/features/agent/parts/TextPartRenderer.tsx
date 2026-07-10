/**
 * TextPartRenderer
 *
 * Renders text content with basic markdown support
 * (bold, italic, code, lists, links).
 */

import type { TextPart } from '@/agents/engine/core/conversation';

interface TextPartRendererProps {
  part: TextPart;
  className?: string;
}

/**
 * Render inline markdown: **bold**, *italic*, `code`, [links](url)
 */
function renderMarkdownInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      nodes.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      nodes.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push(
        <code
          key={key++}
          className="max-w-full whitespace-pre-wrap break-all rounded bg-surface-active px-1.5 py-0.5 font-mono text-xs text-text-secondary [overflow-wrap:anywhere]"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link: [text](url) — block javascript:/data: protocol for XSS prevention
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const href = linkMatch[2].trim();
      const isSafeUrl = /^https?:\/\//i.test(href) || href.startsWith('/') || href.startsWith('#');
      nodes.push(
        <a
          key={key++}
          href={isSafeUrl ? href : '#'}
          className="max-w-full break-all text-primary-400 hover:underline [overflow-wrap:anywhere]"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Plain text (up to next special character)
    const plainMatch = remaining.match(/^[^*`[]+/);
    if (plainMatch) {
      nodes.push(<span key={key++}>{plainMatch[0]}</span>);
      remaining = remaining.slice(plainMatch[0].length);
    } else {
      // Single special character that isn't part of markdown
      nodes.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }
  }

  return nodes;
}

export function TextPartRenderer({ part, className = '' }: TextPartRendererProps) {
  const lines = part.content.split('\n');

  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden break-words text-sm text-text-primary [overflow-wrap:anywhere] ${className}`}
      data-testid="text-part"
    >
      {lines.map((line, i) => {
        // Unordered list items
        if (line.match(/^[-*]\s/)) {
          return (
            <div key={i} className="ml-2 flex min-w-0 max-w-full gap-2">
              <span className="text-text-tertiary">-</span>
              <span className="min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                {renderMarkdownInline(line.slice(2))}
              </span>
            </div>
          );
        }

        // Ordered list items
        const orderedMatch = line.match(/^(\d+)\.\s/);
        if (orderedMatch) {
          return (
            <div key={i} className="ml-2 flex min-w-0 max-w-full gap-2">
              <span className="text-text-tertiary">{orderedMatch[1]}.</span>
              <span className="min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                {renderMarkdownInline(line.slice(orderedMatch[0].length))}
              </span>
            </div>
          );
        }

        // Empty line = paragraph break
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }

        return (
          <p
            key={i}
            className="max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
          >
            {renderMarkdownInline(line)}
          </p>
        );
      })}
    </div>
  );
}
