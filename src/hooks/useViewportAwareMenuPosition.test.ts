import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  getViewportAwareMenuPosition,
  useViewportAwareMenuPosition,
} from './useViewportAwareMenuPosition';

describe('getViewportAwareMenuPosition', () => {
  it('should flip the menu inward when opened near the bottom-right corner', () => {
    expect(
      getViewportAwareMenuPosition({
        x: 980,
        y: 740,
        menuWidth: 200,
        menuHeight: 240,
        viewportWidth: 1024,
        viewportHeight: 768,
      }),
    ).toEqual({ left: 780, top: 500 });
  });

  it('should constrain the menu when it is larger than the viewport', () => {
    expect(
      getViewportAwareMenuPosition({
        x: 4,
        y: 4,
        menuWidth: 400,
        menuHeight: 900,
        viewportWidth: 320,
        viewportHeight: 480,
      }),
    ).toEqual({ left: 8, top: 8, maxHeight: 464 });
  });

  it('should clamp coordinates when the pointer is outside the safe edge', () => {
    expect(
      getViewportAwareMenuPosition({
        x: -50,
        y: -20,
        menuWidth: 160,
        menuHeight: 120,
        viewportWidth: 1024,
        viewportHeight: 768,
      }),
    ).toEqual({ left: 8, top: 8 });
  });

  it('should recompute the position when the mounted menu changes size', () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const observe = vi.fn();
    const disconnect = vi.fn();
    let resizeCallback: ResizeObserverCallback | undefined;

    class TestResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }

      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
    }

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1_000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

    let menuWidth = 100;
    let menuHeight = 100;
    const menu = document.createElement('div');
    vi.spyOn(menu, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: menuWidth,
          bottom: menuHeight,
          width: menuWidth,
          height: menuHeight,
          toJSON: () => ({}),
        }) as DOMRect,
    );

    const menuRef = { current: menu };
    const { result, unmount } = renderHook(() => useViewportAwareMenuPosition(950, 750, menuRef));

    expect(observe).toHaveBeenCalledWith(menu);
    expect(result.current).toEqual({ left: 850, top: 650 });

    menuWidth = 300;
    menuHeight = 500;
    act(() => resizeCallback?.([], {} as ResizeObserver));

    expect(result.current).toEqual({ left: 650, top: 250 });

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);

    globalThis.ResizeObserver = originalResizeObserver;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
  });
});
