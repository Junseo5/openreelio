import { useCallback, useId, useRef, useState, type MouseEvent } from 'react';

import { useTimelineAssetDragSource } from '@/hooks/useTimelineAssetDragSource';
import type { FileTreeEntry } from '@/types';
import { FileTreeEntryRow } from './FileTreeEntryRow';
import { useFileTreeKeyboardNavigation } from './useFileTreeKeyboardNavigation';

export interface FileTreeItemProps {
  /** File tree entry data. */
  entry: FileTreeEntry;
  /** Nesting depth for indentation. */
  depth?: number;
  /** Currently selected path when the tree controls selection. */
  selectedPath?: string | null;
  /** Path of the single item included in the tree's tab order. */
  focusedPath?: string | null;
  /** Handler for updating the active tree item. */
  onSelect?: (entry: FileTreeEntry) => void;
  /** Handler for updating the tree's roving tab stop. */
  onFocusEntry?: (relativePath: string) => void;
  /** Handler for clicking a file. */
  onFileClick?: (entry: FileTreeEntry) => void;
  /** Handler for double-clicking a file. */
  onFileDoubleClick?: (entry: FileTreeEntry) => void;
  /** Handler for right-clicking a file. */
  onContextMenu?: (event: MouseEvent, entry: FileTreeEntry) => void;
}

export function FileTreeItem({
  entry,
  depth = 0,
  selectedPath,
  focusedPath,
  onSelect,
  onFocusEntry,
  onFileClick,
  onFileDoubleClick,
  onContextMenu,
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const [isLocallySelected, setIsLocallySelected] = useState(false);
  const treeItemRef = useRef<HTMLDivElement>(null);
  const childGroupId = useId();
  const isSelected =
    selectedPath === undefined ? isLocallySelected : selectedPath === entry.relativePath;
  const isTabStop = focusedPath === undefined ? depth === 0 : focusedPath === entry.relativePath;

  const selectEntry = useCallback(() => {
    if (selectedPath === undefined) setIsLocallySelected(true);
    onSelect?.(entry);
  }, [entry, onSelect, selectedPath]);

  const handleToggle = useCallback(() => {
    if (!entry.isDirectory) return;
    treeItemRef.current?.focus();
    onFocusEntry?.(entry.relativePath);
    setIsExpanded((previous) => !previous);
  }, [entry.isDirectory, entry.relativePath, onFocusEntry]);

  const handleClick = useCallback(() => {
    treeItemRef.current?.focus();
    selectEntry();
    if (entry.isDirectory) setIsExpanded((previous) => !previous);
    else onFileClick?.(entry);
  }, [entry, onFileClick, selectEntry]);

  const handleDoubleClick = useCallback(() => {
    if (!entry.isDirectory) onFileDoubleClick?.(entry);
  }, [entry, onFileDoubleClick]);

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onContextMenu?.(event, entry);
    },
    [entry, onContextMenu],
  );

  const getTimelineAssetDragPayload = useCallback(() => {
    if (entry.isDirectory) return null;
    return {
      ...(entry.assetId != null ? { assetId: entry.assetId } : {}),
      ...(entry.kind != null ? { assetKind: entry.kind } : {}),
      label: entry.name,
      workspaceRelativePath: entry.relativePath,
    };
  }, [entry]);

  const timelineAssetDragSource = useTimelineAssetDragSource(getTimelineAssetDragPayload);
  const handleKeyDown = useFileTreeKeyboardNavigation({
    treeItemRef,
    isDirectory: entry.isDirectory,
    isExpanded,
    setIsExpanded,
    onActivate: handleClick,
  });

  return (
    <div
      ref={treeItemRef}
      role="treeitem"
      aria-label={entry.name}
      aria-level={depth + 1}
      aria-selected={isSelected}
      aria-expanded={entry.isDirectory ? isExpanded : undefined}
      tabIndex={isTabStop ? 0 : -1}
      className="group/treeitem focus:outline-none"
      onFocus={(event) => {
        if (event.target === event.currentTarget) onFocusEntry?.(entry.relativePath);
      }}
      onKeyDown={handleKeyDown}
    >
      <FileTreeEntryRow
        entry={entry}
        isExpanded={isExpanded}
        isSelected={isSelected}
        childGroupId={childGroupId}
        paddingLeft={8 + depth * 16}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onPointerDown={timelineAssetDragSource.onPointerDown}
        onToggle={handleToggle}
      />

      {entry.isDirectory && isExpanded && entry.children.length > 0 && (
        <div id={childGroupId} role="group">
          {entry.children.map((child) => (
            <FileTreeItem
              key={child.relativePath}
              entry={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              focusedPath={focusedPath}
              onSelect={onSelect}
              onFocusEntry={onFocusEntry}
              onFileClick={onFileClick}
              onFileDoubleClick={onFileDoubleClick}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
