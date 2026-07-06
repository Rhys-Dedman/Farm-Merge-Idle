/**
 * New Garden FTUE 3 — textbox + finger on the Gardens floating button (same pattern as daily tasks FTUE).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { CollectionFtueOverlay, type GameRect } from './CollectionFtueOverlay';
import { COLLECTION_FTUE_BLOCKER_TINT } from '../constants/collectionFtue';
import {
  NEW_GARDEN_FTUE_GARDENS_BUTTON_ID,
  NEW_GARDEN_FTUE_GARDENS_TEXT,
} from '../constants/newGardenFtue';
import {
  FTUE_TEXTBOX,
  FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM,
  FTUE_TEXTBOX_TEXT,
  FTUE_VISUAL_SCALE,
} from '../ftue/ftueTextboxStyles';
import { assetPath } from '../utils/assetPath';

const TEXTBOX_ABOVE_BUTTON_PX = 24 * FTUE_VISUAL_SCALE;

export interface NewGardenGardensFbFtueOverlayProps {
  active: boolean;
  appScale: number;
}

export const NewGardenGardensFbFtueOverlay: React.FC<NewGardenGardensFbFtueOverlayProps> = ({
  active,
  appScale,
}) => {
  const [holeRect, setHoleRect] = useState<GameRect | null>(null);
  const [textboxStyle, setTextboxStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const measure = useCallback(() => {
    const container = document.getElementById('game-container');
    const el = document.getElementById(NEW_GARDEN_FTUE_GARDENS_BUTTON_ID);
    if (!container || !el) {
      setHoleRect(null);
      return;
    }
    const cr = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const hole: GameRect = {
      left: (r.left - cr.left) / appScale,
      top: (r.top - cr.top) / appScale,
      width: r.width / appScale,
      height: r.height / appScale,
    };
    setHoleRect(hole);
    setTextboxStyle({
      position: 'absolute',
      left: '50%',
      top: Math.max(8, hole.top - TEXTBOX_ABOVE_BUTTON_PX),
      transform: 'translate(-50%, -100%)',
      opacity: 1,
      zIndex: 100,
    });
  }, [appScale]);

  useEffect(() => {
    if (!active) {
      setHoleRect(null);
      setTextboxStyle({ opacity: 0 });
      return;
    }
    measure();
    const t = window.setTimeout(measure, 120);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [active, measure]);

  if (!active) return null;

  return (
    <>
      <CollectionFtueOverlay
        active
        holeRect={holeRect}
        fingerStyle="point_right"
        blockerTint={COLLECTION_FTUE_BLOCKER_TINT}
        holePaddingPx={8}
      />
      {holeRect ? (
        <div
          className="pointer-events-none"
          style={{
            ...FTUE_TEXTBOX,
            ...textboxStyle,
            width: `${440 * FTUE_VISUAL_SCALE}px`,
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
            style={{ ...FTUE_TEXTBOX_TEXT, paddingLeft: '20px', paddingRight: '20px' }}
          >
            {NEW_GARDEN_FTUE_GARDENS_TEXT}
          </p>
        </div>
      ) : null}
    </>
  );
};
