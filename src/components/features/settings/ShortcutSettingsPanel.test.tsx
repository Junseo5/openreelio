import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useShortcutStore } from '@/stores/shortcutStore';
import { ShortcutSettingsPanel } from './ShortcutSettingsPanel';

describe('ShortcutSettingsPanel', () => {
  beforeEach(() => {
    useShortcutStore.getState().resetAllBindings();
  });

  it('should not let an earlier conflict timeout close a newer edit session', () => {
    vi.useFakeTimers();
    let unmount: (() => void) | undefined;

    try {
      ({ unmount } = render(<ShortcutSettingsPanel />));

      fireEvent.click(screen.getByRole('button', { name: 'Edit shortcut for Selection Tool' }));
      fireEvent.keyDown(document, { key: 'c', code: 'KeyC' });
      expect(screen.getByText('Conflicts with Razor Tool')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Edit shortcut for Razor Tool' }));
      expect(screen.getByRole('textbox', { name: 'Press a key combination' })).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1500));

      expect(screen.getByRole('textbox', { name: 'Press a key combination' })).toBeInTheDocument();
    } finally {
      unmount?.();
      act(() => vi.runOnlyPendingTimers());
      vi.useRealTimers();
    }
  });
});
