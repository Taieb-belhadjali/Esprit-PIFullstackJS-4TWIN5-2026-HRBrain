import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface TTSContextValue {
  speak: (text: string, lang?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  rate: number;
  setRate: (r: number) => void;
}

const TTSContext = createContext<TTSContextValue>({
  speak: () => {},
  stop: () => {},
  isSpeaking: false,
  isSupported: false,
  rate: 1,
  setRate: () => {},
});

const RATE_KEY = 'hrbrain_tts_rate';

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRateState] = useState<number>(() => {
    const stored = localStorage.getItem(RATE_KEY);
    return stored ? parseFloat(stored) : 1;
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const setRate = useCallback((r: number) => {
    setRateState(r);
    localStorage.setItem(RATE_KEY, String(r));
  }, []);

  // Bug Chrome : speechSynthesis se coupe silencieusement après ~15s.
  // Fix : appeler resume() toutes les 10s pendant la lecture.
  const startKeepAlive = useCallback(() => {
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, lang = 'fr-FR') => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();
      stopKeepAlive();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        startKeepAlive();
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        stopKeepAlive();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        stopKeepAlive();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate, startKeepAlive, stopKeepAlive],
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    stopKeepAlive();
  }, [isSupported, stopKeepAlive]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (isSupported) window.speechSynthesis.cancel();
    stopKeepAlive();
  }, [isSupported, stopKeepAlive]);

  return (
    <TTSContext.Provider value={{ speak, stop, isSpeaking, isSupported, rate, setRate }}>
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS() {
  return useContext(TTSContext);
}
