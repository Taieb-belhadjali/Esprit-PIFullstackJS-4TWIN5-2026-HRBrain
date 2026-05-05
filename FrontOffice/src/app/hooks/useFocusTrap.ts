import { useEffect, useRef } from 'react';

/**
 * WCAG 2.1.1 — Focus Trap
 * Keeps keyboard focus inside a modal/dialog while it is open.
 *
 * When a modal opens:
 *  - Focus moves to the first focusable element inside the container
 *  - Tab / Shift+Tab cycle only within the container
 *  - Escape calls the onClose callback
 *
 * Usage:
 *   const ref = useFocusTrap(isOpen, onClose);
 *   <div ref={ref} role="dialog" ...>...</div>
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(isOpen: boolean, onClose?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  // Use a ref so onClose is always current without being a useEffect dependency.
  // Without this, an inline () => setState() callback creates a new reference on
  // every render, re-triggering the effect and stealing focus back to the first
  // focusable element while the user types.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length > 0) {
      // Only steal focus if no element inside the modal already has it.
      // Without this guard, a user who clicks a specific field right as the
      // modal opens would lose focus to focusable[0] when the rAF fires.
      requestAnimationFrame(() => {
        if (!container.contains(document.activeElement)) {
          focusable[0].focus();
        }
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableNow = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusableNow.length === 0) return;

      const first = focusableNow[0];
      const last  = focusableNow[focusableNow.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]); // onClose excluded intentionally — handled via ref above

  return containerRef;
}
