import { useEffect, useRef, useState } from 'react';
import { Volume2, Square, ChevronUp, Keyboard } from 'lucide-react';
import { useTTS } from './TTSContext';
import { useFocusAnnouncer } from '../../hooks/useFocusAnnouncer';

const RATE_LABELS: Record<number, string> = {
  0.5: 'Lent',
  0.75: 'Modéré',
  1: 'Normal',
  1.25: 'Rapide',
  1.5: 'Très rapide',
};

const FOCUS_READ_KEY = 'hrbrain_tts_focus_read';

export function TTSWidget() {
  const { speak, stop, isSpeaking, isSupported, rate, setRate } = useTTS();
  const [hasSelection, setHasSelection] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Focus reading (screen reader simulation) ──────────────────────────────
  // When enabled, reads the focused element aloud on Tab navigation
  const [focusReadEnabled, setFocusReadEnabled] = useState<boolean>(() => {
    return localStorage.getItem(FOCUS_READ_KEY) === 'true';
  });

  const toggleFocusRead = () => {
    setFocusReadEnabled(prev => {
      const next = !prev;
      localStorage.setItem(FOCUS_READ_KEY, String(next));
      return next;
    });
  };

  // Activate the focus announcer hook
  useFocusAnnouncer(speak, focusReadEnabled);

  const menuRef = useRef<HTMLDivElement>(null);

  // Détection sélection
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      setHasSelection(!!sel && sel.toString().trim().length > 0);
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  // Fermer le menu si clic à l'extérieur
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  // Raccourci Alt+V — lire/arrêter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyV') {
        e.preventDefault();
        if (isSpeaking) {
          stop();
        } else {
          handleSpeak();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSpeaking]);

  if (!isSupported) return null;

  const handleSpeak = () => {
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim();
    if (selectedText) {
      speak(selectedText);
    } else {
      const main = document.querySelector('main') ?? document.body;
      const headings = Array.from(main.querySelectorAll('h1, h2, h3'))
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join('. ');
      const paragraphs = Array.from(main.querySelectorAll('p, td, li'))
        .slice(0, 20)
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join('. ');
      speak((headings + '. ' + paragraphs).trim() || 'Aucun contenu à lire.');
    }
    setMenuOpen(false);
  };

  const handleStop = () => {
    stop();
    setMenuOpen(false);
  };

  return (
    <div ref={menuRef} className="fixed bottom-36 right-4 z-40">
      {/* aria-live invisible pour lecteurs d'écran */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isSpeaking ? 'Lecture en cours' : ''}
      </div>

      {/* Menu contextuel */}
      {menuOpen && (
        <div className="absolute bottom-14 right-0 bg-white border border-slate-200 rounded-xl shadow-xl w-56 overflow-hidden">
          {/* En-tête */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Lecteur vocal</span>
            {hasSelection && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 font-medium">
                Sélection active
              </span>
            )}
          </div>

          {/* Action principale : Lire / Stop */}
          {isSpeaking ? (
            <button
              onClick={handleStop}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <Square size={14} fill="currentColor" className="shrink-0" aria-hidden="true" />
              <span>Arrêter la lecture</span>
              <span className="ml-auto text-[10px] text-slate-400 font-mono">Alt+V</span>
            </button>
          ) : (
            <button
              onClick={handleSpeak}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Volume2 size={14} className="shrink-0" aria-hidden="true" />
              <span>{hasSelection ? 'Lire la sélection' : 'Lire la page'}</span>
              <span className="ml-auto text-[10px] text-slate-400 font-mono">Alt+V</span>
            </button>
          )}

          {/* Séparateur */}
          <div className="border-t border-slate-100 mx-3" />

          {/* ── Lecture au focus (screen reader mode) ── */}
          <div className="px-3 py-2.5">
            <button
              onClick={toggleFocusRead}
              className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                focusReadEnabled
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              aria-pressed={focusReadEnabled}
              aria-label={
                focusReadEnabled
                  ? 'Désactiver la lecture au focus (mode lecteur d\'écran)'
                  : 'Activer la lecture au focus (mode lecteur d\'écran)'
              }
            >
              <Keyboard size={14} className="shrink-0" aria-hidden="true" />
              <div className="flex-1 text-left">
                <p className="font-medium text-xs">Lecture au focus</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {focusReadEnabled ? 'Tab lit les éléments ✓' : 'Tab ne lit pas'}
                </p>
              </div>
              {/* Toggle visuel */}
              <div className={`w-8 h-4 rounded-full transition-colors ${focusReadEnabled ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`w-3 h-3 rounded-full bg-white shadow mt-0.5 transition-transform ${focusReadEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Séparateur */}
          <div className="border-t border-slate-100 mx-3" />

          {/* Slider vitesse */}
          <div className="px-3 py-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Vitesse</span>
              <span className="text-xs font-semibold text-blue-600">
                {RATE_LABELS[rate] ?? `×${rate}`}
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.25}
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              aria-label="Vitesse de lecture"
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.5×</span>
              <span>1×</span>
              <span>1.5×</span>
            </div>
          </div>
        </div>
      )}

      {/* Bouton principal */}
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Lecteur vocal — ouvrir le menu (Alt+V pour lire)"
        aria-expanded={menuOpen}
        title="Lecteur vocal (Alt+V)"
        className={[
          'relative w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          isSpeaking
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : menuOpen
            ? 'bg-blue-600 text-white shadow-blue-200'
            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300',
        ].join(' ')}
      >
        {/* Barres animées pendant lecture */}
        {isSpeaking ? (
          <span className="flex items-end gap-px h-4" aria-hidden="true">
            {[3, 5, 4, 6, 3].map((h, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-white animate-pulse"
                style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s`, animationDuration: '0.7s' }}
              />
            ))}
          </span>
        ) : (
          <Volume2 size={18} aria-hidden="true" />
        )}

        {/* Point vert si sélection active */}
        {hasSelection && !isSpeaking && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" aria-hidden="true" />
        )}

        {/* Indicateur focus read actif */}
        {focusReadEnabled && !isSpeaking && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" aria-hidden="true" />
        )}

        {/* Indicateur chevron menu ouvert */}
        {menuOpen && !isSpeaking && (
          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
            <ChevronUp size={10} className="text-blue-600" aria-hidden="true" />
          </span>
        )}
      </button>
    </div>
  );
}
