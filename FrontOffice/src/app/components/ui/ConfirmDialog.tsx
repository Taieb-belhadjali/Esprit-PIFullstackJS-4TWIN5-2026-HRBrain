import { AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  // WCAG 2.1.1 — focus trap + Escape to close
  const dialogRef = useFocusTrap(open, onCancel);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" aria-hidden="true" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div
          className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6 border border-border"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-2 rounded-lg flex-shrink-0 ${danger ? 'bg-red-100' : 'bg-yellow-100'}`} aria-hidden="true">
              <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-yellow-600'}`} aria-hidden="true" />
            </div>
            <div>
              <h2 id="confirm-title" className="font-semibold text-foreground text-lg">{title}</h2>
              <p id="confirm-message" className="text-sm text-muted-foreground mt-1">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            {/* autoFocus sur Annuler — action sûre par défaut (WCAG 3.3.4) */}
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-white text-sm transition-colors focus:outline-none focus:ring-2 ${
                danger ? 'bg-destructive hover:bg-destructive/90 focus:ring-destructive' : 'bg-primary hover:bg-primary/90 focus:ring-primary'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
