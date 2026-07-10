import {
  useCallback,
  type Dispatch,
  type KeyboardEvent,
  type RefObject,
  type SetStateAction,
} from 'react';

interface FileTreeKeyboardNavigationOptions {
  treeItemRef: RefObject<HTMLDivElement | null>;
  isDirectory: boolean;
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
  onActivate: () => void;
}

function getVisibleTreeItems(treeItem: HTMLDivElement | null): HTMLElement[] {
  const tree = treeItem?.closest<HTMLElement>('[role="tree"]');
  return tree ? Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]')) : [];
}

function focusSibling(treeItem: HTMLDivElement | null, offset: number): void {
  const treeItems = getVisibleTreeItems(treeItem);
  const currentIndex = treeItems.indexOf(treeItem as HTMLElement);
  treeItems[currentIndex + offset]?.focus();
}

function focusBoundary(treeItem: HTMLDivElement | null, boundary: 'first' | 'last'): void {
  const treeItems = getVisibleTreeItems(treeItem);
  treeItems[boundary === 'first' ? 0 : treeItems.length - 1]?.focus();
}

function focusFirstChild(treeItem: HTMLDivElement | null): void {
  const childGroup = Array.from(treeItem?.children ?? []).find(
    (child) => child.getAttribute('role') === 'group',
  );
  childGroup?.querySelector<HTMLElement>('[role="treeitem"]')?.focus();
}

function focusParent(treeItem: HTMLDivElement | null): void {
  treeItem?.parentElement?.closest<HTMLElement>('[role="treeitem"]')?.focus();
}

export function useFileTreeKeyboardNavigation({
  treeItemRef,
  isDirectory,
  isExpanded,
  setIsExpanded,
  onActivate,
}: FileTreeKeyboardNavigationOptions) {
  return useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        onActivate();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        focusSibling(treeItemRef.current, event.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        event.stopPropagation();
        focusBoundary(treeItemRef.current, event.key === 'Home' ? 'first' : 'last');
        return;
      }
      if (event.key === 'ArrowRight' && isDirectory) {
        event.preventDefault();
        event.stopPropagation();
        if (isExpanded) focusFirstChild(treeItemRef.current);
        else setIsExpanded(true);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopPropagation();
        if (isDirectory && isExpanded) setIsExpanded(false);
        else focusParent(treeItemRef.current);
      }
    },
    [isDirectory, isExpanded, onActivate, setIsExpanded, treeItemRef],
  );
}
