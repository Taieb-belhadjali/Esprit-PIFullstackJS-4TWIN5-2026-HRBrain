import { createContext, useContext, useEffect, useState } from 'react';

interface ReadingMaskContextType {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  maskHeight: number;
  setMaskHeight: (v: number) => void;
  opacity: number;
  setOpacity: (v: number) => void;
}

const ReadingMaskContext = createContext<ReadingMaskContextType>({
  enabled: false,
  setEnabled: () => {},
  maskHeight: 60,
  setMaskHeight: () => {},
  opacity: 0.6,
  setOpacity: () => {},
});

export function ReadingMaskProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(() =>
    localStorage.getItem('hrbrain_reading_mask') === 'true'
  );
  const [maskHeight, setMaskHeightState] = useState(() =>
    parseInt(localStorage.getItem('hrbrain_mask_height') ?? '60')
  );
  const [opacity, setOpacityState] = useState(() =>
    parseFloat(localStorage.getItem('hrbrain_mask_opacity') ?? '0.6')
  );

  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    localStorage.setItem('hrbrain_reading_mask', String(v));
  };
  const setMaskHeight = (v: number) => {
    setMaskHeightState(v);
    localStorage.setItem('hrbrain_mask_height', String(v));
  };
  const setOpacity = (v: number) => {
    setOpacityState(v);
    localStorage.setItem('hrbrain_mask_opacity', String(v));
  };

  return (
    <ReadingMaskContext.Provider value={{ enabled, setEnabled, maskHeight, setMaskHeight, opacity, setOpacity }}>
      {children}
    </ReadingMaskContext.Provider>
  );
}

export const useReadingMask = () => useContext(ReadingMaskContext);
