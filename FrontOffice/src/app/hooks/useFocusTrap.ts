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
  // Remember which element had focus before the modal opened
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Move focus to first focusable element inside the modal
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length > 0) {
      // Small delay to ensure the modal is fully rendered
      requestAnimationFrame(() => focusable[0].focus());
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape → close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      // Tab / Shift+Tab → cycle within modal
      if (e.key !== 'Tab') return;

      const focusableNow = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusableNow.length === 0) return;

      const first = focusableNow[0];
      const last  = focusableNow[focusableNow.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that triggered the modal
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return containerRef;
}
