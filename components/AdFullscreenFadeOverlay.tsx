import React, { useEffect, useState } from 'react';

interface AdFullscreenFadeOverlayProps {
  active: boolean;
  durationMs: number;
  fromOpacity?: number;
  toOpacity?: number;
  zIndex?: number;
}

/**
 * Full-screen black fade used before ads. Blocks input for the full duration.
 */
export const AdFullscreenFadeOverlay: React.FC<AdFullscreenFadeOverlayProps> = ({
  active,
  durationMs,
  fromOpacity = 0,
  toOpacity = 1,
  zIndex = 115,
}) => {
  const [opacity, setOpacity] = useState(fromOpacity);

  useEffect(() => {
    if (!active) {
      setOpacity(fromOpacity);
      return;
    }

    setOpacity(fromOpacity);
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setOpacity(fromOpacity + (toOpacity - fromOpacity) * t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, durationMs, fromOpacity, toOpacity]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex,
        backgroundColor: '#000',
        opacity,
        pointerEvents: 'auto',
      }}
      aria-hidden
    />
  );
};
