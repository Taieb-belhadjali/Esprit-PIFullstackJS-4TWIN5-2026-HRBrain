import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// WCAG 1.4.4: steps from 100% (16px) to 200% (32px)
const STEPS = [16, 18, 20, 24, 28, 32]; 
const DEFAULT_INDEX = 0; 
const STORAGE_KEY = 'hrbrain_font_size_index';

interface FontSizeContextValue {
  sizeIndex: number;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
  canIncrease: boolean;
  canDecrease: boolean;
  percent: number; 
}

const FontSizeContext = createContext<FontSizeContextValue>({
  sizeIndex: DEFAULT_INDEX,
  increase: () => {},
  decrease: () => {},
  reset: () => {},
  canIncrease: true,
  canDecrease: false,
  percent: 100,
});

function applySize(index: number) {
  const px = STEPS[index];
  document.documentElement.style.setProperty('--font-size', `${px}px`);
}

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [sizeIndex, setSizeIndex] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const idx = stored !== null ? parseInt(stored, 10) : DEFAULT_INDEX;
    return idx >= 0 && idx < STEPS.length ? idx : DEFAULT_INDEX;
  });

  // Apply on mount and on change
  useEffect(() => {
    applySize(sizeIndex);
    localStorage.setItem(STORAGE_KEY, String(sizeIndex));
  }, [sizeIndex]);

  const increase = useCallback(() => {
    setSizeIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, []);

  const decrease = useCallback(() => {
    setSizeIndex((i) => Math.max(i - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setSizeIndex(DEFAULT_INDEX);
  }, []);

  // Keyboard shortcuts: Ctrl++ increase, Ctrl+- decrease, Ctrl+0 reset
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      // Ctrl+= ou Ctrl++ → augmenter
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault(); increase();
      }
      // Ctrl+- → diminuer
      else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault(); decrease();
      }
      // Ctrl+0 → reset
      else if (e.code === 'Digit0' || e.code === 'Numpad0') {
        e.preventDefault(); reset();
      }
      // Garder aussi les flèches
      else if (e.code === 'ArrowUp')   { e.preventDefault(); increase(); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); decrease(); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); reset(); }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [increase, decrease, reset]);

  return (
    <FontSizeContext.Provider
      value={{
        sizeIndex,
        increase,
        decrease,
        reset,
        canIncrease: sizeIndex < STEPS.length - 1,
        canDecrease: sizeIndex > 0,
        percent: Math.round((STEPS[sizeIndex] / STEPS[DEFAULT_INDEX]) * 100),
      }}
    >
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
