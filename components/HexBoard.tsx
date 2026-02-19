
import React, { useState } from 'react';
import { BoardCell } from '../types';

interface HexBoardProps {
  isActive?: boolean;
  grid: BoardCell[];
  onMerge: (sourceIdx: number, targetIdx: number) => void;
  impactCellIdx: number | null;
}

const CROP_ICONS = [
  '🌱', '🌿', '🌻', '🌽', '🍎', '🍓', '🥕', '🥔', '🍉', '🍇'
];

export const HexBoard: React.FC<HexBoardProps> = ({ isActive, grid, onMerge, impactCellIdx }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  
  // Logical size for grid positioning (Reduced from 36 by 5% to 34.2)
  const hexSize = 34.2; 
  // Visual scale to create gaps (Increased from 0.85 to 0.93 to make cells closer)
  const visualScale = 0.93;
  
  const hexWidth = 2 * hexSize * visualScale;
  const hexHeight = Math.sqrt(3) * hexSize * visualScale;

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
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      <div className="relative w-full h-full">
        {/* 
          PASS 1: OUTER SHADOWS 
          We render these first so they sit behind ALL cell bodies.
          This prevents any shadow from being drawn on top of a neighboring cell.
        */}
        {grid.map((cell, i) => {
          const x = hexSize * (3 / 2) * cell.q;
          const y = hexSize * Math.sqrt(3) * (cell.r + cell.q / 2);
          const isSelected = selectedIdx === i;
          
          return (
            <div
              key={`shadow-${i}`}
              className="absolute transition-all duration-300 pointer-events-none"
              style={{
                left: centerX,
                top: centerY,
                width: `${hexWidth}px`,
                height: `${hexHeight}px`,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) ${isSelected ? 'scale(1.1)' : ''}`,
                // Extremely subtle shadow as requested
                filter: isSelected 
                  ? 'drop-shadow(0 0 12px rgba(215, 233, 121, 0.4))' 
                  : 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.12))'
              }}
            >
              <div className="absolute inset-0 hexagon bg-transparent" />
              {/* This mimics the 3D base shadow */}
              <div className="absolute inset-0 hexagon bg-transparent" style={{ transform: 'translateY(2.5px)' }} />
            </div>
          );
        })}

        {/* 
          PASS 2: CELL BODIES
          Rendered on top of the shadow layer.
        */}
        {grid.map((cell, i) => {
          const x = hexSize * (3 / 2) * cell.q;
          const y = hexSize * Math.sqrt(3) * (cell.r + cell.q / 2);
          const isSelected = selectedIdx === i;
          const isImpacted = impactCellIdx === i;

          return (
            <div
              key={`cell-${i}`}
              id={`hex-${i}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCellClick(i);
              }}
              className={`absolute pointer-events-auto transition-all duration-300 flex items-center justify-center group ${
                isSelected ? 'scale-110 z-40' : 'hover:scale-105 active:scale-95'
              } ${isImpacted ? 'scale-125 z-40' : ''}`}
              style={{
                left: centerX,
                top: centerY,
                width: `${hexWidth}px`,
                height: `${hexHeight}px`,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
            >
              {/* 1. Outer Depth Layer (#87ae4a) - 3D Base */}
              <div 
                className="absolute inset-0 hexagon transition-all duration-300"
                style={{
                  background: '#87ae4a',
                  transform: 'translateY(2.5px)'
                }}
              />

              {/* 2. Outer Outline Layer (#8db04c) - Thinner padding (1.5px) */}
              <div 
                className="absolute inset-0 hexagon flex items-center justify-center transition-all duration-300"
                style={{
                  background: '#8db04c',
                  padding: '1.5px' 
                }}
              >
                {/* 3. Top Border/Rim Layer (#d7e979) */}
                <div 
                  className="w-full h-full hexagon flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isSelected ? '#fff' : '#d7e979',
                    padding: '3px' // Rim thickness
                  }}
                >
                  {/* 4. Inner Face - Flat Fill (#9eb849) */}
                  <div 
                    className="w-full h-full hexagon relative flex items-center justify-center overflow-hidden"
                    style={{
                      background: '#9eb849',
                    }}
                  >
                    {/* Subtle Texture Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-white/5 pointer-events-none" />
                    
                    {cell.item ? (
                      <div className="flex flex-col items-center justify-center animate-in zoom-in spin-in-12 duration-500 fill-mode-both relative z-10">
                        <span className="text-3xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
                          {CROP_ICONS[Math.min(cell.item.level - 1, CROP_ICONS.length - 1)]}
                        </span>
                        {cell.item.level > 1 && (
                          <div className="absolute bottom-[-10px] bg-black/60 px-1.5 py-0.5 rounded-md border border-white/20 scale-75">
                             <span className="text-[9px] font-black text-[#d7e979]">LV{cell.item.level}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 hexagon bg-black/5"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
