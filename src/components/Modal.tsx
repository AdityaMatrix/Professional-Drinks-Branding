import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Modal.module.css';

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode };

/** The native dialog gives us the focus trap, Escape and focus return without any extra code. */
export function Modal({ open, title, onClose, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog ref={dialog} className={styles.modal} aria-labelledby={titleId} onClose={onClose}>
      {open && (
        <>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {children}
        </>
      )}
    </dialog>
  );
}
