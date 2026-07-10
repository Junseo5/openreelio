import { useCallback, useLayoutEffect, useState, type RefObject } from 'react';

const DEFAULT_VIEWPORT_PADDING_PX = 8;

export interface ViewportAwareMenuPositionInput {
  x: number;
  y: number;
  menuWidth: number;
  menuHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  padding?: number;
}

export interface ViewportAwareMenuPosition {
  left: number;
  top: number;
  maxHeight?: number;
}

/**
 * Keep an overlay menu inside the visible viewport while preserving the
 * pointer position when there is enough space.
 */
export function getViewportAwareMenuPosition({
  x,
  y,
  menuWidth,
  menuHeight,
  viewportWidth,
  viewportHeight,
  padding = DEFAULT_VIEWPORT_PADDING_PX,
}: ViewportAwareMenuPositionInput): ViewportAwareMenuPosition {
  const safeViewportWidth = Math.max(0, viewportWidth);
  const safeViewportHeight = Math.max(0, viewportHeight);
  const safeMenuWidth = Math.max(0, menuWidth);
  const safeMenuHeight = Math.max(0, menuHeight);
  const maxLeft = Math.max(padding, safeViewportWidth - safeMenuWidth - padding);
  const maxTop = Math.max(padding, safeViewportHeight - safeMenuHeight - padding);

  const preferredLeft = x + safeMenuWidth > safeViewportWidth - padding ? x - safeMenuWidth : x;
  const left = Math.min(Math.max(padding, preferredLeft), maxLeft);

  const availableHeight = Math.max(0, safeViewportHeight - padding * 2);
  if (safeMenuHeight > availableHeight) {
    return {
      left,
      top: padding,
      maxHeight: availableHeight,
    };
  }

  const preferredTop = y + safeMenuHeight > safeViewportHeight - padding ? y - safeMenuHeight : y;
  return {
    left,
    top: Math.min(Math.max(padding, preferredTop), maxTop),
  };
}

/**
 * Measure a menu after it mounts and update its fixed position on viewport
 * changes so menus opened near an edge remain fully reachable.
 */
export function useViewportAwareMenuPosition(
  x: number,
  y: number,
  menuRef: RefObject<HTMLElement | null>,
): ViewportAwareMenuPosition {
  const [position, setPosition] = useState<ViewportAwareMenuPosition>({ left: x, top: y });

  const updatePosition = useCallback(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const menuRect = menu.getBoundingClientRect();
    setPosition(
      getViewportAwareMenuPosition({
        x,
        y,
        menuWidth: menuRect.width,
        menuHeight: menuRect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }),
    );
  }, [menuRef, x, y]);

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);

    let resizeObserver: ResizeObserver | null = null;
    const menu = menuRef.current;
    if (menu && typeof ResizeObserver !== 'undefined') {
      try {
        resizeObserver = new ResizeObserver(updatePosition);
        resizeObserver.observe(menu);
      } catch {
        resizeObserver?.disconnect();
        resizeObserver = null;
      }
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      resizeObserver?.disconnect();
    };
  }, [menuRef, updatePosition]);

  return position;
}
