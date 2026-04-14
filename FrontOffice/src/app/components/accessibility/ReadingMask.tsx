import { useEffect, useState } from 'react';
import { useReadingMask } from '../../context/ReadingMaskContext';

export function ReadingMask() {
  const { enabled, maskHeight, opacity } = useReadingMask();
  const [mouseY, setMouseY] = useState(-999);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  if (!enabled) return null;

  const bandTop    = mouseY - maskHeight / 2;
  const bandBottom = mouseY + maskHeight / 2;
  const bg         = `rgba(0, 0, 0, ${opacity})`;

  return (
    <>
      {/* Overlay au-dessus de la bande */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: Math.max(0, bandTop),
          background: bg,
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'height 0.05s linear',
        }}
      />

      {/* Bande claire (ligne lue) — bordures colorées pour la délimiter */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: bandTop,
          left: 0,
          right: 0,
          height: maskHeight,
          pointerEvents: 'none',
          zIndex: 9998,
          borderTop: '2px solid rgba(99, 102, 241, 0.5)',
          borderBottom: '2px solid rgba(99, 102, 241, 0.5)',
          transition: 'top 0.05s linear',
        }}
      />

      {/* Overlay en-dessous de la bande */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: bandBottom,
          left: 0,
          right: 0,
          bottom: 0,
          background: bg,
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'top 0.05s linear',
        }}
      />
    </>
  );
}
