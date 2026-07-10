import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModalShell } from './ModalShell';

describe('ModalShell', () => {
  it('should keep fixed actions visible when the body scrolls', () => {
    render(
      <ModalShell
        ariaLabelledBy="modal-title"
        testId="test-modal"
        header={<h2 id="modal-title">Dialog title</h2>}
        footer={<button type="button">Save changes</button>}
      >
        <div>{Array.from({ length: 40 }, (_, index) => `Long content ${index}`).join('\n')}</div>
      </ModalShell>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Dialog title' });
    const body = dialog.querySelector('[data-modal-slot="body"]');
    const footer = dialog.querySelector('[data-modal-slot="footer"]');

    expect(body).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(body).not.toContainElement(screen.getByRole('button', { name: 'Save changes' }));
    expect(within(footer as HTMLElement).getByRole('button')).toBeInTheDocument();
  });

  it('should close only when the backdrop is clicked', () => {
    const onRequestClose = vi.fn();
    render(
      <ModalShell ariaLabel="Example" testId="test-modal" onRequestClose={onRequestClose}>
        <button type="button">Inside</button>
      </ModalShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Inside' }));
    expect(onRequestClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('test-modal-overlay'));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('should trap and restore focus when hidden controls are present', () => {
    const opener = document.createElement('button');
    opener.textContent = 'Open dialog';
    document.body.append(opener);
    opener.focus();

    const { unmount } = render(
      <ModalShell ariaLabel="Focus example">
        <button type="button">First action</button>
        <div style={{ display: 'none' }}>
          <button type="button">Hidden action</button>
        </div>
        <button type="button">Last action</button>
      </ModalShell>,
    );

    const firstAction = screen.getByRole('button', { name: 'First action' });
    const lastAction = screen.getByRole('button', { name: 'Last action' });

    expect(firstAction).toHaveFocus();

    fireEvent.keyDown(firstAction, { key: 'Tab' });
    expect(lastAction).toHaveFocus();

    fireEvent.keyDown(lastAction, { key: 'Tab' });
    expect(firstAction).toHaveFocus();

    fireEvent.keyDown(firstAction, { key: 'Tab', shiftKey: true });
    expect(lastAction).toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('should restore body scrolling when the modal unmounts', () => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';

    const { unmount } = render(
      <ModalShell ariaLabel="Scroll lock example">
        <button type="button">Action</button>
      </ModalShell>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = previousOverflow;
  });
});
