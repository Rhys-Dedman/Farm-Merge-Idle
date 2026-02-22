
import React, { useState } from 'react';
import { BoardCell } from '../types';

interface HexBoardProps {
  isActive?: boolean;
  grid: BoardCell[];
  onMerge: (sourceIdx: number, targetIdx: number) => void;
  impactCellIdx: number | null;
}

// Increase when you add more plant_N.png. Merge level N uses plant_N (e.g. two plant_1 → plant_2).
const MAX_AVAILABLE_PLANT_LEVEL = 4;
const PLANT_SPRITE_EXT = '.png';

function getPlantSpritePath(level: number): string {
  const spriteLevel = Math.min(level, MAX_AVAILABLE_PLANT_LEVEL);
  return `/assets/plants/plant_${spriteLevel}${PLANT_SPRITE_EXT}`;
}

const HEX_SPRITE_EXT = '.png';
const HEXCELL_GREEN = `/assets/hex/hexcell_green${HEX_SPRITE_EXT}`;
const HEXCELL_SHADOW = `/assets/hex/hexcell_shadow${HEX_SPRITE_EXT}`;
const HEXCELL_WHITE = `/assets/hex/hexcell_white${HEX_SPRITE_EXT}`;

export const HexBoard: React.FC<HexBoardProps> = ({ isActive, grid, onMerge, impactCellIdx }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  
  // Logical size for grid positioning
  const hexSize = 34.2;
  // Visual scale: higher = cells closer together
  const visualScale = 0.96;
  // Vertical squash: hex cells 5% shorter (0.95 height)
  const verticalSquash = 0.95;
  // Vertical spacing scaled to match shorter hex for even gaps
  const verticalSpacing = verticalSquash;
  // X-axis spacing between cells
  const horizontalSpacing = 1.0;
  // Bring all cells slightly closer (keeps x/y ratio); slightly higher = tiny bit more space
  const gridSpacing = 0.96;
  // Overall grid 15% larger (was 10%, +5%)
  const gridScale = 1.155;
  const shadowOffsetY = 5;

  const hexWidth = 2 * hexSize * visualScale;
  const hexHeight = Math.sqrt(3) * hexSize * visualScale * verticalSquash;
  // Hex cells 20% bigger; shadow/green/white all use same size
  const cellScale = 1.2;
  const hexDisplayW = hexWidth * cellScale;
  const hexDisplayH = hexHeight * cellScale;

  const hideBrokenHexImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  };

  const handleCellClick = (index: number) => {
    const cell = grid[index];
    if (selectedIdx === null) {
      if (cell.item) setSelectedIdx(index);
    } else {
      if (selectedIdx === index) {
        setSelectedIdx(null);
      } else {
        onMerge(selectedIdx, index);
        setSelectedIdx(null);
      }
    }
  };

  const centerX = '50%';
  const centerY = '48%'; 

  return (
    <>
      <style>{`
        @keyframes impactPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .impact-pulse {
          animation: impactPulse 150ms ease-out;
        }
        @keyframes plantSpawnBounce {
          0% { opacity: 0; transform: scale(0.25); }
          25% { opacity: 1; transform: scale(1.5); }
          50% { transform: scale(0.8); }
          75% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .plant-spawn-bounce {
          animation: plantSpawnBounce 300ms ease-out forwards;
        }
        @keyframes hexcellWhiteFlash {
          0% { opacity: 0; }
          50% { opacity: 0.5; }
          100% { opacity: 0; }
        }
        .hexcell-white-flash {
          animation: hexcellWhiteFlash 200ms ease-out forwards;
        }
        .hex-cell-img {
          display: block;
        }
        .hex-cell-img[src=""],
        .hex-cell-img:not([src]) {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <div
          className="relative w-full h-full"
          style={{ transform: `scale(${gridScale})`, transformOrigin: 'center center' }}
        >
        {/* PASS 1: hexcell_shadow — one per cell, always below all green/white (z-0) */}
        {grid.map((cell, i) => {
          const x = hexSize * (3 / 2) * cell.q * horizontalSpacing * gridSpacing;
          const y = hexSize * Math.sqrt(3) * (cell.r + cell.q / 2) * verticalSpacing * gridSpacing;
          return (
            <div
              key={`hex-shadow-${i}`}
              className="absolute pointer-events-none overflow-hidden"
              style={{
                left: centerX,
                top: centerY,
                width: `${hexDisplayW}px`,
                height: `${hexDisplayH}px`,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + shadowOffsetY}px))`,
                zIndex: 0,
                backgroundImage: `url(${HEXCELL_SHADOW})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          );
        })}

        {/* PASS 2: hexcell_green — one sprite per cell (idle) */}
        {grid.map((cell, i) => {
          const x = hexSize * (3 / 2) * cell.q * horizontalSpacing * gridSpacing;
          const y = hexSize * Math.sqrt(3) * (cell.r + cell.q / 2) * verticalSpacing * gridSpacing;
          const isSelected = selectedIdx === i;

          return (
            <div
              key={`cell-${i}`}
              id={`hex-${i}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCellClick(i);
              }}
              className="absolute pointer-events-auto flex items-center justify-center overflow-hidden"
              style={{
                left: centerX,
                top: centerY,
                width: `${hexDisplayW}px`,
                height: `${hexDisplayH}px`,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                zIndex: isSelected ? 40 : 10,
              }}
            >
              <img
                src={HEXCELL_GREEN}
                alt=""
                className={`hex-cell-img w-full h-full object-contain transition-transform duration-300 ${
                  isSelected ? 'scale-110' : 'hover:scale-105 active:scale-95'
                }`}
                onError={hideBrokenHexImg}
              />
            </div>
          );
        })}

        {/* PASS 3: hexcell_white — on top of each green; 0% default, 0→50→0% over 200ms on impact */}
        {grid.map((cell, i) => {
          const x = hexSize * (3 / 2) * cell.q * horizontalSpacing * gridSpacing;
          const y = hexSize * Math.sqrt(3) * (cell.r + cell.q / 2) * verticalSpacing * gridSpacing;
          const isImpacted = impactCellIdx === i;

          return (
            <div
              key={`hex-white-${i}`}
              className="absolute pointer-events-none flex items-center justify-center overflow-hidden"
              style={{
                left: centerX,
                top: centerY,
                width: `${hexDisplayW}px`,
                height: `${hexDisplayH}px`,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                zIndex: 45,
              }}
            >
              <img
                src={HEXCELL_WHITE}
                alt=""
                className={`hex-cell-img w-full h-full object-contain opacity-0 ${
                  isImpacted ? 'hexcell-white-flash' : ''
                }`}
                onError={hideBrokenHexImg}
              />
            </div>
          );
        })}

        {/* PASS 4: PLANTS (above all hex cells; no masking; lower y = in front) */}
        {(() => {
          const cellsWithPlants = grid
            .map((cell, i) => {
              const x = hexSize * (3 / 2) * cell.q * horizontalSpacing * gridSpacing;
              const y = hexSize * Math.sqrt(3) * (cell.r + cell.q / 2) * verticalSpacing * gridSpacing;
              return { i, cell, x, y };
            })
            .filter(({ cell }) => cell.item != null)
            .sort((a, b) => a.y - b.y); // ascending y so higher y (lower on screen) renders last = in front

          return (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
              {cellsWithPlants.map(({ i, cell, x, y }) => {
                const isImpacted = impactCellIdx === i;
                const item = cell.item!;
                return (
                  <div
                    key={`plant-${i}`}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: centerX,
                      top: centerY,
                      width: `${hexWidth}px`,
                      height: `${hexHeight}px`,
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      zIndex: 50 + Math.round(y),
                    }}
                  >
                    <div className="flex flex-col items-center justify-center relative w-full h-full">
                      <div style={{ transform: `translateY(-${hexHeight * 0.1}px) scale(1.5)` }} className="flex items-center justify-center w-full h-full">
                        <img
                          src={getPlantSpritePath(item.level)}
                          alt={`Plant ${item.level}`}
                          className={`w-[70%] h-[70%] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] ${
                            isImpacted ? 'plant-spawn-bounce' : ''
                          }`}
                        />
                      </div>
                      {item.level > 1 && (
                        <div className="absolute bottom-[-10px] bg-black/60 px-1.5 py-0.5 rounded-md border border-white/20 scale-75">
                          <span className="text-[9px] font-black text-[#d7e979]">LV{item.level}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
    </>
  );
};
