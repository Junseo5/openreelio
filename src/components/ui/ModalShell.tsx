import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type KeyboardEventHandler,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useModalFocusManagement } from './useModalFocusManagement';

export interface ModalShellProps {
  /** Dialog role; alert dialogs should only be used for interruptive warnings. */
  role?: 'dialog' | 'alertdialog';
  /** Accessible label reference for the dialog title. */
  ariaLabelledBy?: string;
  /** Accessible label when the dialog has no visible title element. */
  ariaLabel?: string;
  /** Fixed content rendered above the scroll region. */
  header?: ReactNode;
  /** Scrollable dialog content. */
  children: ReactNode;
  /** Fixed content rendered below the scroll region. */
  footer?: ReactNode;
  /** Called when the user clicks the backdrop. */
  onRequestClose?: () => void;
  /** Keyboard handler for the modal scope. */
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  /** Additional overlay classes. */
  overlayClassName?: string;
  /** Additional dialog surface classes. */
  dialogClassName?: string;
  /** Maximum responsive dialog width. */
  widthClassName?: string;
  /** Additional classes for the scroll region. */
  bodyClassName?: string;
  /** Optional test identifier for the dialog surface. */
  testId?: string;
  /** Optional test identifier for the backdrop/overlay. */
  overlayTestId?: string;
  /** Allows callers with focus management to focus the dialog surface. */
  tabIndex?: number;
}

/**
 * Responsive modal layout with fixed header/footer and one scrollable body.
 * Feature dialogs retain control of their visual styling and close behavior.
 */
export const ModalShell = forwardRef<HTMLDivElement, ModalShellProps>(function ModalShell(
  {
    ariaLabelledBy,
    ariaLabel,
    role = 'dialog',
    header,
    children,
    footer,
    onRequestClose,
    onKeyDown,
    overlayClassName = 'bg-black/60',
    dialogClassName = '',
    widthClassName = 'max-w-lg',
    bodyClassName = '',
    testId,
    overlayTestId,
    tabIndex,
  },
  ref,
) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const trapModalFocus = useModalFocusManagement(dialogRef);

  useImperativeHandle(ref, () => dialogRef.current as HTMLDivElement, []);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      onRequestClose?.();
    }
  };

  const handleModalKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    onKeyDown?.(event);
    trapModalFocus(event);
  };

  return (
    <div
      className={`fixed inset-0 z-modal flex items-center justify-center p-4 ${overlayClassName}`}
      data-testid={overlayTestId ?? (testId ? `${testId}-overlay` : undefined)}
      onClick={handleBackdropClick}
      onKeyDown={handleModalKeyDown}
    >
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        tabIndex={tabIndex ?? -1}
        data-testid={testId}
        className={`flex max-h-[calc(100dvh-2rem)] w-full ${widthClassName} flex-col overflow-hidden [overflow-wrap:anywhere] ${dialogClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {header && (
          <div className="shrink-0" data-modal-slot="header">
            {header}
          </div>
        )}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${bodyClassName}`}
          data-modal-slot="body"
        >
          {children}
        </div>
        {footer && (
          <div className="shrink-0" data-modal-slot="footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});
