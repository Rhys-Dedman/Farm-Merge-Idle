/**
 * Collection FTUE — post-upgrade step: textbox over panel copy + finger on shelf-0 reward icon.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { CollectionFtueOverlay, type GameRect } from './CollectionFtueOverlay';
import {
  COLLECTION_FTUE_BLOCKER_TINT,
  COLLECTION_FTUE_BONUSES_CTA_ID,
  COLLECTION_FTUE_BONUSES_MESSAGE,
  COLLECTION_FTUE_PANEL_COPY_ID,
  COLLECTION_FTUE_SHELF0_REWARD_ICON_ID,
} from '../constants/collectionFtue';
import {
  FTUE_TEXTBOX,
  FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM,
  FTUE_TEXTBOX_TEXT,
  FTUE_VISUAL_SCALE,
} from '../ftue/ftueTextboxStyles';
import { assetPath } from '../utils/assetPath';

export interface CollectionBonusesFtueOverlayProps {
  active: boolean;
  appScale: number;
  isFadingOut?: boolean;
  onViewBonuses: () => void;
}

export const CollectionBonusesFtueOverlay: React.FC<CollectionBonusesFtueOverlayProps> = ({
  active,
  appScale,
  isFadingOut = false,
  onViewBonuses,
}) => {
  const [holeRects, setHoleRects] = useState<GameRect[] | null>(null);
  const [rewardTapRect, setRewardTapRect] = useState<GameRect | null>(null);
  const [textboxStyle, setTextboxStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [ctaPressed, setCtaPressed] = useState(false);

  const measure = useCallback(() => {
    const container = document.getElementById('game-container');
    if (!container) {
      setHoleRects(null);
      setTextboxStyle({ opacity: 0 });
      return;
    }
    const cr = container.getBoundingClientRect();
    const scale = appScale || 1;
    const measureEl = (id: string): GameRect | null => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: (r.left - cr.left) / scale,
        top: (r.top - cr.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
      };
    };
    const copyRect = measureEl(COLLECTION_FTUE_PANEL_COPY_ID);
    const textboxWidthPx = 480 * FTUE_VISUAL_SCALE;
    if (copyRect) {
      setTextboxStyle({
        position: 'absolute',
        left: copyRect.left + copyRect.width / 2,
        top: copyRect.top - 18,
        width: Math.max(textboxWidthPx, copyRect.width + 24),
        transform: 'translateX(-50%)',
        opacity: isFadingOut ? 0 : 1,
        zIndex: 100,
        transition: 'opacity 280ms ease-out',
      });
    } else {
      setTextboxStyle({ opacity: 0 });
    }
    const ctaRect = measureEl(COLLECTION_FTUE_BONUSES_CTA_ID);
    const rewardRect = measureEl(COLLECTION_FTUE_SHELF0_REWARD_ICON_ID);
    if (!ctaRect || !rewardRect) {
      setHoleRects(null);
      setRewardTapRect(null);
      return;
    }
    const padHole = (r: GameRect, padding: number): GameRect => ({
      left: r.left - padding,
      top: r.top - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2,
    });
    const scaleRectAroundCenter = (r: GameRect, scale: number): GameRect => {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const width = r.width * scale;
      const height = r.height * scale;
      return {
        left: cx - width / 2,
        top: cy - height / 2,
        width,
        height,
      };
    };
    setHoleRects([padHole(ctaRect, 4), rewardRect]);
    setRewardTapRect(
      scaleRectAroundCenter(padHole(rewardRect, 20 + 52 * FTUE_VISUAL_SCALE), 0.35),
    );
  }, [appScale, isFadingOut]);

  useEffect(() => {
    if (!active) {
      setHoleRects(null);
      setRewardTapRect(null);
      setTextboxStyle({ opacity: 0 });
      return;
    }
    measure();
    const t = window.setTimeout(measure, 120);
    const t2 = window.setTimeout(measure, 280);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.removeEventListener('resize', measure);
    };
  }, [active, measure]);

  if (!active) return null;

  const rewardHoleIndex = holeRects != null && holeRects.length > 1 ? 1 : 0;

  return (
    <>
      <CollectionFtueOverlay
        active
        holeRects={holeRects}
        fingerStyle="point_at"
        fingerHoleIndex={rewardHoleIndex}
        blockerTint={COLLECTION_FTUE_BLOCKER_TINT}
        holePaddingPx={0}
        isFadingOut={isFadingOut}
      />
      <div
          className="pointer-events-none"
          style={{
            ...FTUE_TEXTBOX,
            ...textboxStyle,
            width: textboxStyle.width ?? `${300 * FTUE_VISUAL_SCALE}px`,
            paddingTop: `${14 * FTUE_VISUAL_SCALE}px`,
            paddingLeft: `${12 * FTUE_VISUAL_SCALE}px`,
            paddingRight: `${12 * FTUE_VISUAL_SCALE}px`,
            paddingBottom: `${14 * FTUE_VISUAL_SCALE + 10}px`,
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        >
          <div
            className="flex w-full items-center justify-center"
            style={{ marginBottom: FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM }}
          >
            <img
              src={assetPath('/assets/ui/popup_divider.png')}
              alt=""
              className="h-auto object-contain"
              style={{ width: '100%' }}
            />
          </div>
          <p
            className="m-0 text-center font-medium italic leading-snug"
            style={{
              fontFamily: FTUE_TEXTBOX_TEXT.fontFamily,
              fontSize: `${20 * FTUE_VISUAL_SCALE}px`,
              textAlign: FTUE_TEXTBOX_TEXT.textAlign,
              color: FTUE_TEXTBOX_TEXT.color,
              paddingLeft: '12px',
              paddingRight: '12px',
              marginBottom: `${20 * FTUE_VISUAL_SCALE}px`,
            }}
          >
            {COLLECTION_FTUE_BONUSES_MESSAGE}
          </p>
          <button
            id={COLLECTION_FTUE_BONUSES_CTA_ID}
            type="button"
            className="relative mx-auto flex items-center justify-center whitespace-nowrap transition-all border outline outline-1 rounded-[8px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] pointer-events-auto active:translate-y-[2px] active:border-b-0 active:mb-[4px]"
            style={{
              height: 34,
              width: 'fit-content',
              minWidth: 150,
              marginTop: 6,
              paddingLeft: 12,
              paddingRight: 12,
              backgroundColor: ctaPressed ? '#61882b' : '#cae060',
              borderColor: ctaPressed ? '#61882b' : '#9db546',
              borderBottomWidth: ctaPressed ? '0px' : '4px',
              marginBottom: ctaPressed ? '4px' : '0px',
              outlineColor: ctaPressed ? '#61882b' : '#9db546',
            }}
            onMouseDown={() => setCtaPressed(true)}
            onMouseUp={() => setCtaPressed(false)}
            onMouseLeave={() => setCtaPressed(false)}
            onClick={onViewBonuses}
          >
            <span
              className="font-bold tracking-tighter"
              style={{
                color: ctaPressed ? '#cbe05d' : '#587e26',
                fontSize: 15.6,
                fontWeight: 700,
              }}
            >
              View Bonuses
            </span>
          </button>
        </div>
      {rewardTapRect && !isFadingOut ? (
        <button
          type="button"
          className="absolute border-0 bg-transparent p-0 cursor-pointer pointer-events-auto"
          style={{
            left: rewardTapRect.left,
            top: rewardTapRect.top,
            width: rewardTapRect.width,
            height: rewardTapRect.height,
            zIndex: 103,
          }}
          aria-label="View bonuses"
          onClick={onViewBonuses}
        />
      ) : null}
    </>
  );
};
