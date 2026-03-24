/**
 * Plant sprite + shared pot underneath (same center, pot z below). Use anywhere the board plant
 * art appears so scale / drag / bounce animations apply to both layers together.
 */
import React from 'react';
import { assetPath } from '../utils/assetPath';

/** Highest plant level with a `plant_N.png` in `/assets/plants/` (game has 24 tiers). */
export const MAX_PLANT_SPRITE_LEVEL = 24;

export function getPlantSpritePath(level: number): string {
  const spriteLevel = Math.min(Math.max(1, level), MAX_PLANT_SPRITE_LEVEL);
  return assetPath(`/assets/plants/plant_${spriteLevel}.png`);
}

export const PLANT_POT_SRC = assetPath('/assets/plants/plant_pot.png');
export const PLANT_POT_M1_SRC = assetPath('/assets/plants/plant_pot_m1.png');

export interface PlantWithPotProps {
  level: number;
  /** When true, show mastered pot variant for this plant level. */
  mastered?: boolean;
  /** Barn: soft light pulse on pot + plant art when mastery unlock is pending. */
  masteryAdditiveGlow?: boolean;
  /** Seconds; use negative value from shared epoch so multiple instances stay in phase. */
  masteryGlowDelaySec?: number;
  /**
   * Outer wrapper — put percentage sizes here (e.g. `w-[70%] h-[70%]` on hex board) so they resolve
   * against the same parent as a lone `<img>` would; inner stack uses `wrapperClassName` to fill this box.
   */
  className?: string;
  /** Inner box that both images fill (default `h-full w-full` of outer). */
  wrapperClassName?: string;
  potClassName?: string;
  plantClassName?: string;
  style?: React.CSSProperties;
  /** Applied to both <img> (plus defaults for touch/select). */
  imageStyle?: React.CSSProperties;
  alt?: string;
  draggable?: boolean;
  onContextMenu?: React.MouseEventHandler<HTMLImageElement>;
}

export const PlantWithPot: React.FC<PlantWithPotProps> = ({
  level,
  mastered = false,
  masteryAdditiveGlow = false,
  masteryGlowDelaySec = 0,
  className = '',
  wrapperClassName = 'h-full w-full',
  potClassName = '',
  plantClassName = '',
  style,
  imageStyle,
  alt = '',
  draggable = false,
  onContextMenu,
}) => {
  const baseImgStyle: React.CSSProperties = {
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    pointerEvents: 'none',
    ...imageStyle,
  };

  // Without explicit w/h (e.g. shed, plant info), a plant <img> used to give the box intrinsic size.
  // Level 0 uses an empty in-flow div + absolute pot — percentages collapse to 0 unless we fill the parent.
  const rootClass =
    `${className.trim() ? className.trim() : 'h-full w-full'} relative flex items-center justify-center`.trim();
  const potSrc = mastered ? PLANT_POT_M1_SRC : PLANT_POT_SRC;

  return (
    <div className={rootClass} style={style}>
      <div className={`relative flex items-center justify-center ${wrapperClassName}`.trim()}>
        <img
          src={potSrc}
          alt=""
          draggable={false}
          className={`absolute inset-0 z-0 h-full w-full object-contain ${potClassName}`.trim()}
          style={baseImgStyle}
        />
        {masteryAdditiveGlow && (
          <img
            src={potSrc}
            alt=""
            aria-hidden
            draggable={false}
            className={`plant-mastery-additive-pulse pointer-events-none absolute inset-0 z-[1] h-full w-full object-contain ${potClassName}`.trim()}
            style={{
              mixBlendMode: 'soft-light',
              filter: 'brightness(0) invert(1)',
              animationDelay: `${masteryGlowDelaySec}s`,
            }}
          />
        )}
        {level > 0 ? (
          <>
            <img
              src={getPlantSpritePath(level)}
              alt={alt}
              draggable={draggable}
              onContextMenu={onContextMenu}
              className={`relative z-[2] h-full w-full object-contain ${plantClassName}`.trim()}
              style={{
                ...baseImgStyle,
                pointerEvents: draggable ? 'auto' : 'none',
              }}
            />
            {masteryAdditiveGlow && (
              <img
                src={getPlantSpritePath(level)}
                alt=""
                aria-hidden
                draggable={false}
                className={`plant-mastery-additive-pulse pointer-events-none absolute inset-0 z-[3] h-full w-full object-contain ${plantClassName}`.trim()}
                style={{
                  mixBlendMode: 'soft-light',
                  filter: 'brightness(0) invert(1)',
                  animationDelay: `${masteryGlowDelaySec}s`,
                }}
              />
            )}
          </>
        ) : (
          <div
            className={`relative z-[2] h-full w-full shrink-0 ${plantClassName}`.trim()}
            aria-hidden
            style={{
              ...baseImgStyle,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
};
