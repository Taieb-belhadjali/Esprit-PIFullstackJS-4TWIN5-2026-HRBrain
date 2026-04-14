// Panneau des raccourcis clavier : s’ouvre avec "?" et se ferme avec Échap
import { useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutEntry {
  keys: string[];
  description: string;
}

// Liste de tous les raccourcis affichés dans le panneau
const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['Alt', 'H'], description: 'Naviguer vers Accueil' },
  { keys: ['Alt', 'E'], description: 'Naviguer vers Employés' },
  { keys: ['Alt', 'S'], description: 'Naviguer vers Skills' },
  { keys: ['Alt', 'D'], description: 'Naviguer vers Départements' },
  { keys: ['Alt', 'T'], description: 'Naviguer vers Activités' },
  { keys: ['Alt', 'R'], description: 'Naviguer vers Recommandations' },
  { keys: ['Alt', 'L'], description: 'Naviguer vers Analytics' },
  { keys: ['Alt', 'N'], description: 'Naviguer vers Notifications' },
  { keys: ['Alt', 'P'], description: 'Naviguer vers Profil' },
  { keys: ['Alt', 'M'], description: 'Ouvrir le micro (assistant vocal)' },
  { keys: ['?'],        description: 'Afficher ce panneau' },
  { keys: ['Échap'],    description: 'Fermer ce panneau' },
];

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

export function KeyboardShortcutsPanel({ onClose }: KeyboardShortcutsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

// Focus le bouton fermer à l’ouverture du panneau
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Ferme le panneau avec la touche Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Piège le focus dans le panneau (accessibilité modale)
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    panel.addEventListener('keydown', trap);
    return () => panel.removeEventListener('keydown', trap);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panneau */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Keyboard className="w-5 h-5" aria-hidden="true" />
            <h2 id="shortcuts-title" className="font-semibold text-base">
              Raccourcis clavier
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-lg p-1 transition-colors focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Fermer le panneau des raccourcis"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Liste */}
        <ul className="divide-y divide-gray-100 px-5 py-2" role="list">
          {SHORTCUTS.map(({ keys, description }) => (
            <li
              key={description}
              className="flex items-center justify-between py-3"
            >
              <span className="text-sm text-foreground">{description}</span>
              <span className="flex items-center gap-1">
                {keys.map((key, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <kbd className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-mono font-semibold text-foreground shadow-sm">
                      {key}
                    </kbd>
                    {i < keys.length - 1 && (
                      <span className="text-xs text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <p className="px-5 pb-4 text-xs text-muted-foreground">
          Appuyez sur <kbd className="font-mono font-semibold">Échap</kbd> ou cliquez à l'extérieur pour fermer.
        </p>
      </div>
    </>
  );
}
