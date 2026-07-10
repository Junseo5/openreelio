/**
 * Context Menu Component
 *
 * Robust, accessible, viewport-aware context menu with keyboard navigation.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useViewportAwareMenuPosition } from '@/hooks/useViewportAwareMenuPosition';

// =============================================================================
// Types
// =============================================================================

export interface MenuItem {
  type?: never;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface MenuDivider {
  type: 'divider';
}

export type MenuItemOrDivider = MenuItem | MenuDivider;

export interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItemOrDivider[];
  onClose: () => void;
}

// =============================================================================
// Context Menu Component
// =============================================================================

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Smart positioning
  const { left, top, maxHeight } = useViewportAwareMenuPosition(x, y, menuRef);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50); // Small debounce to avoid immediate close

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const menuItemIndices = items
        .map((item, idx) => (!('type' in item) ? idx : -1))
        .filter((idx) => idx !== -1);

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setFocusedIndex((prev) => {
          const currentIndex = menuItemIndices.indexOf(prev);
          const nextIndex = currentIndex + 1 < menuItemIndices.length ? currentIndex + 1 : 0;
          return menuItemIndices[nextIndex];
        });
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setFocusedIndex((prev) => {
          const currentIndex = menuItemIndices.indexOf(prev);
          const nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : menuItemIndices.length - 1;
          return menuItemIndices[nextIndex];
        });
      }

      if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        e.stopPropagation();
        const item = items[focusedIndex] as MenuItem;
        if (item && !item.disabled) {
          item.onClick();
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, onClose]);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[100] min-w-[200px] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-border-subtle bg-surface-elevated py-1.5 shadow-xl animate-scale-in"
      style={{
        left,
        top,
        maxHeight,
      }}
    >
      {items.map((item, index) => {
        if ('type' in item && item.type === 'divider') {
          return <div key={`divider-${index}`} className="my-1.5 h-px bg-border-subtle w-full" />;
        }

        const menuItem = item as MenuItem;
        const isFocused = index === focusedIndex;

        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (!menuItem.disabled) {
                menuItem.onClick();
                onClose();
              }
            }}
            onMouseEnter={() => setFocusedIndex(index)}
            disabled={menuItem.disabled}
            className={`
              w-full px-3 py-2 text-left text-sm flex items-center justify-between
              transition-colors duration-50 select-none
              ${
                menuItem.disabled
                  ? 'opacity-40 cursor-not-allowed text-text-muted'
                  : menuItem.danger
                    ? 'text-status-error hover:bg-status-error/10'
                    : 'text-text-primary hover:bg-surface-active'
              }
              ${isFocused && !menuItem.disabled ? 'bg-surface-active' : ''}
              focus:outline-none
            `}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {menuItem.icon && <span className="h-4 w-4 shrink-0">{menuItem.icon}</span>}
              <span className="min-w-0 break-words font-medium [overflow-wrap:anywhere]">
                {menuItem.label}
              </span>
            </span>
            {menuItem.shortcut && (
              <span className="ml-6 shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted opacity-70">
                {menuItem.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
