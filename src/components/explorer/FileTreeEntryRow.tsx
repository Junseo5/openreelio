import type { MouseEventHandler, PointerEventHandler } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  Film,
  Folder,
  Image as ImageIcon,
  Music,
} from 'lucide-react';

import type { AssetKind, FileTreeEntry } from '@/types';

interface FileTreeEntryRowProps {
  entry: FileTreeEntry;
  isExpanded: boolean;
  isSelected: boolean;
  childGroupId: string;
  paddingLeft: number;
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu: MouseEventHandler<HTMLDivElement>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onToggle: () => void;
}

function getFileIcon(kind?: AssetKind) {
  switch (kind) {
    case 'video':
      return <Film className="h-4 w-4 shrink-0 text-blue-400" />;
    case 'audio':
      return <Music className="h-4 w-4 shrink-0 text-green-400" />;
    case 'image':
      return <ImageIcon className="h-4 w-4 shrink-0 text-purple-400" />;
    case 'subtitle':
      return <FileText className="h-4 w-4 shrink-0 text-yellow-400" />;
    default:
      return <File className="h-4 w-4 shrink-0 text-text-secondary" />;
  }
}

function formatFileSize(bytes?: number): string {
  if (bytes == null || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function FileTreeEntryRow({
  entry,
  isExpanded,
  isSelected,
  childGroupId,
  paddingLeft,
  onClick,
  onDoubleClick,
  onContextMenu,
  onPointerDown,
  onToggle,
}: FileTreeEntryRowProps) {
  return (
    <div
      data-workspace-entry-path={entry.relativePath}
      data-workspace-entry-directory={entry.isDirectory ? 'true' : 'false'}
      data-tree-row="true"
      className={`group flex min-w-0 cursor-pointer items-center gap-1.5 py-0.5 text-sm transition-colors hover:bg-surface-active group-focus-visible/treeitem:ring-1 group-focus-visible/treeitem:ring-inset group-focus-visible/treeitem:ring-primary-400 ${
        isSelected ? 'bg-surface-active' : ''
      } ${entry.missing ? 'opacity-50' : ''}`}
      style={{ paddingLeft }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      draggable={false}
      title={entry.relativePath}
    >
      {entry.isDirectory ? (
        <button
          type="button"
          tabIndex={-1}
          className="flex-shrink-0 rounded p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-400"
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${entry.name}`}
          aria-expanded={isExpanded}
          aria-controls={entry.children.length > 0 ? childGroupId : undefined}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-text-secondary" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3 w-3 text-text-secondary" aria-hidden="true" />
          )}
        </button>
      ) : (
        <span className="w-4 flex-shrink-0" aria-hidden="true" />
      )}

      {entry.isDirectory ? (
        <Folder className="h-4 w-4 flex-shrink-0 text-yellow-500" />
      ) : (
        getFileIcon(entry.kind)
      )}
      <span className="min-w-0 flex-1 truncate text-editor-text">{entry.name}</span>
      {!entry.isDirectory && entry.missing && (
        <span title="File not found — it may have been moved or deleted">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" aria-hidden="true" />
        </span>
      )}
      {!entry.isDirectory && entry.fileSize != null && (
        <span className="mr-2 flex-shrink-0 text-[10px] text-text-muted">
          {formatFileSize(entry.fileSize)}
        </span>
      )}
    </div>
  );
}
