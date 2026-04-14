import { useFontSize } from './FontSizeContext';

export function FontSizeWidget() {
  const { increase, decrease, reset, canIncrease, canDecrease, percent, sizeIndex } = useFontSize();

  return (
    <div
      className="fixed bottom-52 right-4 z-40"
      role="group"
      aria-label="Taille du texte"
    >
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full shadow px-2 py-1">
        {/* Diminuer */}
        <button
          onClick={decrease}
          disabled={!canDecrease}
          aria-label="Réduire la taille du texte"
          title="Réduire (A−)"
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 text-sm font-semibold
            enabled:hover:bg-slate-100 enabled:hover:text-slate-800
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          A−
        </button>

        {/* Pourcentage / reset */}
        <button
          onClick={reset}
          aria-label={`Réinitialiser la taille du texte (actuellement ${percent}%)`}
          title={`Réinitialiser (${percent}%)`}
          className="px-1.5 h-7 rounded-full flex items-center justify-center text-[11px] font-medium text-slate-500
            hover:bg-slate-100 hover:text-slate-800 transition-colors min-w-[36px]"
        >
          {sizeIndex === 0 ? (
            <span className="text-slate-400">A</span>
          ) : (
            <span className="text-blue-600">{percent}%</span>
          )}
        </button>

        {/* Augmenter */}
        <button
          onClick={increase}
          disabled={!canIncrease}
          aria-label="Augmenter la taille du texte"
          title="Augmenter (A+)"
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 text-base font-semibold
            enabled:hover:bg-slate-100 enabled:hover:text-slate-800
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          A+
        </button>
      </div>
    </div>
  );
}
