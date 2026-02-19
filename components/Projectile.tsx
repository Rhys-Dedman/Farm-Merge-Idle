
import React, { useEffect, useState, useRef } from 'react';
import { ProjectileData } from '../App';

interface ProjectileProps {
  data: ProjectileData;
  onImpact: () => void;
  onComplete: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  life: number;
  size: number;
  vx: number;
  vy: number;
}

export const Projectile: React.FC<ProjectileProps> = ({ data, onImpact, onComplete }) => {
  const [airPos, setAirPos] = useState<Point>({ x: data.startX, y: data.startY });
  const [shadowPos, setShadowPos] = useState<Point>({ x: data.startX, y: data.startY });
  
  const [airTrail, setAirTrail] = useState<Point[]>([]);
  const [shadowTrail, setShadowTrail] = useState<Point[]>([]);
  
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [isImpacted, setIsImpacted] = useState(false);
  
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const particleIdCounter = useRef(0);
  const [targetCoords, setTargetCoords] = useState<Point | null>(null);
  const [containerHeight, setContainerHeight] = useState(800);

  const particleDiameter = 21;
  const maxTrailPoints = 25; 
  const maxShadowTrailPoints = Math.floor(maxTrailPoints * 1.5); // 50% longer trail for shadow

  useEffect(() => {
    const el = document.getElementById(`hex-${data.targetIdx}`);
    const container = document.getElementById('game-container');
    if (el && container) {
      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setContainerHeight(containerRect.height);
      setTargetCoords({
        x: (rect.left + rect.width / 2) - containerRect.left,
        y: (rect.top + rect.height / 2) - containerRect.top
      });
    }
  }, [data.targetIdx]);

  useEffect(() => {
    if (!targetCoords) return;

    // Adjusted duration: 610ms
    const DURATION = 610; 
    const dx = targetCoords.x - data.startX;
    const dy = targetCoords.y - data.startY;
    
    const safetyMargin = containerHeight * 0.12;
    const peakY = Math.max(safetyMargin, 50);

    const leanFactor = 0.45;
    const airCp1: Point = {
      x: data.startX + (dx * leanFactor),
      y: peakY 
    };

    const airCp2: Point = {
      x: targetCoords.x - (dx * 0.1),
      y: peakY 
    };

    const shadowCp1: Point = {
      x: data.startX + (dx * 0.4),
      y: data.startY + (dy * 0.3) - 10
    };
    const shadowCp2: Point = {
      x: targetCoords.x - (dx * 0.4),
      y: targetCoords.y - (dy * 0.1) - 5
    };

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      let t = Math.min(elapsed / DURATION, 1);

      // Fast Start, Medium Airtime, Fast Impact Easing (Power curve 0.7)
      const p = 0.7;
      let tt: number;
      if (t < 0.5) {
        tt = 0.5 * Math.pow(t * 2, p);
      } else {
        tt = 1 - 0.5 * Math.pow((1 - t) * 2, p);
      }

      if (t < 1) {
        const ax = Math.pow(1 - tt, 3) * data.startX + 
                   3 * Math.pow(1 - tt, 2) * tt * airCp1.x + 
                   3 * (1 - tt) * Math.pow(tt, 2) * airCp2.x + 
                   Math.pow(tt, 3) * targetCoords.x;
                   
        const ayReal = Math.pow(1 - tt, 3) * data.startY + 
                       3 * Math.pow(1 - tt, 2) * tt * airCp1.y + 
                       3 * (1 - tt) * Math.pow(tt, 2) * airCp2.y + 
                       Math.pow(tt, 3) * targetCoords.y;

        const sx = Math.pow(1 - tt, 3) * data.startX + 
                   3 * Math.pow(1 - tt, 2) * tt * shadowCp1.x + 
                   3 * (1 - tt) * Math.pow(tt, 2) * shadowCp2.x + 
                   Math.pow(tt, 3) * targetCoords.x;
                   
        const sy = Math.pow(1 - tt, 3) * data.startY + 
                   3 * Math.pow(1 - tt, 2) * tt * shadowCp1.y + 
                   3 * (1 - tt) * Math.pow(tt, 2) * shadowCp2.y + 
                   Math.pow(tt, 3) * targetCoords.y;

        const newAirPos = { x: ax, y: ayReal };
        const newShadowPos = { x: sx, y: sy };
        
        setAirPos(newAirPos);
        setShadowPos(newShadowPos);
        
        setAirTrail(prev => [newAirPos, ...prev].slice(0, maxTrailPoints));
        setShadowTrail(prev => [newShadowPos, ...prev].slice(0, maxShadowTrailPoints));

        const sparkleChance = t > 0.6 ? 0.22 : 0.12;
        if (Math.random() < sparkleChance) {
          const count = Math.floor(Math.random() * 2) + 2;
          for (let i = 0; i < count; i++) {
            const pId = particleIdCounter.current++;
            setSparkles(prev => [...prev, {
              id: pId,
              x: ax + (Math.random() - 0.5) * 6,
              y: ayReal + (Math.random() - 0.5) * 6,
              life: 1,
              size: Math.random() * 3 + 3,
              vx: (Math.random() - 0.5) * 0.7,
              vy: (Math.random() - 0.5) * 0.7
            }]);
          }
        }
      } else if (!isImpacted) {
        setIsImpacted(true);
        onImpact();
      }

      setSparkles(prev => 
        prev.map(p => ({ 
          ...p, 
          x: p.x + p.vx,
          y: p.y + p.vy + 0.018, 
          life: p.life - 0.025 
        })).filter(p => p.life > 0)
      );

      if (t >= 1) {
        setAirTrail(prev => prev.slice(0, Math.max(0, prev.length - 3)));
        setShadowTrail(prev => prev.slice(0, Math.max(0, prev.length - 3)));
      }

      if (t >= 1 && airTrail.length === 0 && shadowTrail.length === 0 && sparkles.length === 0) {
        onComplete();
      } else {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [targetCoords, data.startX, data.startY, isImpacted, airTrail.length, shadowTrail.length, sparkles.length, containerHeight]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <filter id="p-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
          </filter>
        </defs>
        
        {/* Shadow Trail Group at 50% Opacity */}
        <g filter="url(#p-glow)" style={{ opacity: 0.5 }}>
          {shadowTrail.map((p, i) => {
            if (i === 0) return null;
            const prev = shadowTrail[i-1];
            const taperProgress = i / maxShadowTrailPoints;
            const widthScale = 1.0 - (taperProgress * 0.5); // 100% to 50%
            const fadeScale = 1.0 - taperProgress;
            return (
              <line
                key={`shadow-trail-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={p.x}
                y2={p.y}
                stroke="#6a994e"
                strokeWidth={particleDiameter * widthScale}
                strokeLinecap="round"
                strokeOpacity={fadeScale}
              />
            );
          })}
        </g>

        {/* Air Trail Group */}
        <g filter="url(#p-glow)">
          {airTrail.map((p, i) => {
            if (i === 0) return null;
            const prev = airTrail[i-1];
            const taperProgress = i / maxTrailPoints;
            const widthScale = 1.0 - (taperProgress * 0.5); // 100% to 50%
            const opacityScale = (1.0 - taperProgress) * 0.75;
            return (
              <line
                key={`air-trail-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={p.x}
                y2={p.y}
                stroke="#fcf0c6"
                strokeWidth={particleDiameter * widthScale}
                strokeLinecap="round"
                strokeOpacity={opacityScale}
              />
            );
          })}
        </g>
      </svg>

      {sparkles.map(p => (
        <div 
          key={p.id} 
          className="absolute rounded-full bg-[#fdf9e9] shadow-[0_0_12px_#fcf0c6] mix-blend-screen" 
          style={{ 
            left: p.x, 
            top: p.y, 
            width: p.size, 
            height: p.size, 
            opacity: p.life,
            transform: 'translate(-50%, -50%)' 
          }} 
        />
      ))}

      {!isImpacted && (
        <>
          {/* Shadow Head at 50% Opacity */}
          <div 
            className="absolute z-[9]" 
            style={{ 
              left: shadowPos.x, 
              top: shadowPos.y, 
              opacity: 0.5,
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <div 
              className="rounded-full shadow-[0_0_15px_rgba(106,153,78,0.4)]"
              style={{
                width: `${particleDiameter}px`,
                height: `${particleDiameter}px`,
                background: '#6a994e'
              }}
            />
          </div>

          {/* Air Head */}
          <div 
            className="absolute z-10" 
            style={{ 
              left: airPos.x, 
              top: airPos.y, 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <div 
              className="rounded-full shadow-[0_0_30px_rgba(252,240,198,0.7)] flex items-center justify-center border-2 border-white/60"
              style={{
                width: `${particleDiameter}px`,
                height: `${particleDiameter}px`,
                background: '#fdf9e9'
              }}
            >
              <span className="text-[12px] select-none filter drop-shadow-sm">🌱</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
