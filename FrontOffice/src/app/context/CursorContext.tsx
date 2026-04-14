import { createContext, useContext, useEffect, useState } from 'react';

export type CursorSize = 'normal' | 'large' | 'xlarge';

interface CursorContextType {
  cursorSize: CursorSize;
  setCursorSize: (size: CursorSize) => void;
}

const CursorContext = createContext<CursorContextType>({
  cursorSize: 'normal',
  setCursorSize: () => {},
});

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [cursorSize, setCursorSizeState] = useState<CursorSize>(() => {
    return (localStorage.getItem('hrbrain_cursor_size') as CursorSize) ?? 'normal';
  });

  const setCursorSize = (size: CursorSize) => {
    setCursorSizeState(size);
    localStorage.setItem('hrbrain_cursor_size', size);
  };

  useEffect(() => {
    // Supprimer les anciennes classes
    document.documentElement.classList.remove('cursor-large', 'cursor-xlarge');
    if (cursorSize === 'large')  document.documentElement.classList.add('cursor-large');
    if (cursorSize === 'xlarge') document.documentElement.classList.add('cursor-xlarge');
  }, [cursorSize]);

  return (
    <CursorContext.Provider value={{ cursorSize, setCursorSize }}>
      {children}
    </CursorContext.Provider>
  );
}

export const useCursor = () => useContext(CursorContext);
