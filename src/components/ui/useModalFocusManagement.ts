import { useCallback, useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let bodyScrollLockCount = 0;
let bodyOverflowBeforeLock = '';

function isCssHidden(element: HTMLElement, container: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current) {
    const style = window.getComputedStyle(current);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    ) {
      return true;
    }
    if (current === container) break;
    current = current.parentElement;
  }
  return false;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.hidden &&
      !element.matches(':disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
      !isCssHidden(element, container),
  );
}

function lockBodyScrolling(): () => void {
  if (bodyScrollLockCount === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyScrollLockCount += 1;
  return () => {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
    if (bodyScrollLockCount === 0) {
      document.body.style.overflow = bodyOverflowBeforeLock;
      bodyOverflowBeforeLock = '';
    }
  };
}

function trapFocus(event: KeyboardEvent<HTMLDivElement>, dialog: HTMLDivElement): void {
  const focusableElements = getFocusableElements(dialog);
  event.preventDefault();
  if (focusableElements.length === 0) {
    dialog.focus();
    return;
  }

  const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
  const nextIndex = event.shiftKey
    ? currentIndex <= 0
      ? focusableElements.length - 1
      : currentIndex - 1
    : currentIndex < 0 || currentIndex === focusableElements.length - 1
      ? 0
      : currentIndex + 1;
  focusableElements[nextIndex]?.focus();
}

export function useModalFocusManagement(
  dialogRef: RefObject<HTMLDivElement | null>,
): (event: KeyboardEvent<HTMLDivElement>) => void {
  const returnFocusRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    const returnTarget = returnFocusRef.current;
    if (!dialog) return undefined;

    if (!(document.activeElement instanceof Node) || !dialog.contains(document.activeElement)) {
      (getFocusableElements(dialog)[0] ?? dialog).focus();
    }
    return () => {
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, [dialogRef]);

  useEffect(() => lockBodyScrolling(), []);

  return useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const dialog = dialogRef.current;
      if (event.defaultPrevented || event.key !== 'Tab' || !dialog) return;
      trapFocus(event, dialog);
    },
    [dialogRef],
  );
}
