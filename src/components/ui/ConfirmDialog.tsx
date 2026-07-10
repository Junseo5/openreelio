/**
 * ConfirmDialog Component
 *
 * Reusable confirmation dialog for destructive actions.
 */

import { useCallback, useId, useRef, useEffect, type KeyboardEvent } from 'react';
import { ModalShell } from './ModalShell';

// =============================================================================
// Types
// =============================================================================

export type ConfirmDialogVariant = 'default' | 'danger' | 'warning';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Custom confirm button label */
  confirmLabel?: string;
  /** Custom cancel button label */
  cancelLabel?: string;
  /** Dialog variant for styling */
  variant?: ConfirmDialogVariant;
  /** Whether the dialog is in loading state */
  isLoading?: boolean;
  /** Whether clicking backdrop closes the dialog */
  closeOnBackdrop?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const VARIANT_CLASSES: Record<ConfirmDialogVariant, string> = {
  default: 'bg-primary-600 hover:bg-primary-700',
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-yellow-600 hover:bg-yellow-700',
};

// =============================================================================
// Component
// =============================================================================

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  closeOnBackdrop = true,
}: ConfirmDialogProps) {
  const titleId = useId();

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel],
  );

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) {
      onCancel();
    }
  }, [closeOnBackdrop, onCancel]);

  // ===========================================================================
  // Refs
  // ===========================================================================

  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // ===========================================================================
  // Effects
  // ===========================================================================

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      // Focus the cancel button when dialog opens for better accessibility
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // ===========================================================================
  // Render
  // ===========================================================================

  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      ariaLabelledBy={titleId}
      onRequestClose={handleBackdropClick}
      onKeyDown={handleKeyDown}
      overlayClassName="bg-surface-overlay backdrop-blur-sm"
      overlayTestId="dialog-backdrop"
      testId="confirm-dialog"
      widthClassName="max-w-md"
      dialogClassName="rounded-lg border border-border-default bg-surface-elevated shadow-xl"
      header={
        <h2 id={titleId} className="px-6 pt-6 text-lg font-semibold text-text-primary">
          {title}
        </h2>
      }
      footer={
        <div className="flex flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end sm:gap-3">
          <button
            ref={cancelButtonRef}
            data-testid="cancel-button"
            type="button"
            className="rounded bg-surface-active px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-highest disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            data-testid="confirm-button"
            type="button"
            className={`flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && (
              <div
                data-testid="loading-spinner"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
            )}
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="break-words px-6 pb-6 pt-2 text-text-secondary [overflow-wrap:anywhere]">
        {message}
      </p>
    </ModalShell>
  );
}
