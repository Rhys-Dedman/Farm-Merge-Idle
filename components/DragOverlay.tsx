import React from 'react';
import { DragState } from '../types';

interface DragOverlayProps {
  dragState: DragState;
}

/** Renders only the drag trail. The plant is rendered by HexBoard and moved via transform. */
export function DragOverlay({ dragState }: DragOverlayProps) {
  const filterId = React.useId().replace(/:/g, '-');
  const isFlying = dragState.phase === 'flyingBack';
  const isImpact = dragState.phase === 'impact';
  const flyProgress = dragState.flyProgress ?? 0;
  const idleDefaultY = 5.5;
  const liftDuringFly = idleDefaultY + (20 - idleDefaultY) * (1 - flyProgress);
  const trail =
    (isFlying || isImpact) && dragState.trail && dragState.trail.length > 1
      ? dragState.trail
      : [];
  const trailStroke = 48;

  if (trail.length < 2) return null;

  return (
    <div className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 10 }}>
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          {trail.slice(0, -1).map((_, i) => {
            const prev = trail[i];
            const next = trail[i + 1];
            const n = Math.max(1, trail.length - 1);
            const progressPrev = (trail.length - 1 - i) / n;
            const progressNext = (trail.length - 1 - (i + 1)) / n;
            const liftPrev = idleDefaultY + (20 - idleDefaultY) * (1 - progressPrev);
            const liftNext = idleDefaultY + (20 - idleDefaultY) * (1 - progressNext);
            const taper = i / Math.max(trail.length, 1);
            const opacity = Math.min(1, (1 - taper) * 1.2) * 0.5;
            const w = trailStroke * (1 - taper * 0.5);
            return (
              <line
                key={`t-${i}`}
                x1={prev.x}
                y1={prev.y - liftPrev}
                x2={next.x}
                y2={next.y - liftNext}
                stroke="#fbf3d4"
                strokeWidth={w}
                strokeLinecap="round"
                strokeOpacity={opacity}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
