/**
 * Collection FTUE — post-upgrade step: finger on shelf-0 reward icon + hole on View Bonuses.
 * Copy lives on the flower-collection panel (not a separate FTUE textbox).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { CollectionFtueOverlay, type GameRect } from './CollectionFtueOverlay';
import {
  COLLECTION_FTUE_BLOCKER_TINT,
  COLLECTION_FTUE_SHELF0_REWARD_ICON_ID,
  COLLECTION_FTUE_VIEW_BONUSES_ID,
} from '../constants/collectionFtue';
import { FTUE_VISUAL_SCALE } from '../ftue/ftueTextboxStyles';

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

  const measure = useCallback(() => {
    const container = document.getElementById('game-container');
    if (!container) {
      setHoleRects(null);
      setRewardTapRect(null);
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
    const viewBonusesRect = measureEl(COLLECTION_FTUE_VIEW_BONUSES_ID);
    const rewardRect = measureEl(COLLECTION_FTUE_SHELF0_REWARD_ICON_ID);
    if (!viewBonusesRect || !rewardRect) {
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
    const scaleRectAroundCenter = (r: GameRect, scaleFactor: number): GameRect => {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const width = r.width * scaleFactor;
      const height = r.height * scaleFactor;
      return {
        left: cx - width / 2,
        top: cy - height / 2,
        width,
        height,
      };
    };
    setHoleRects([padHole(viewBonusesRect, 4), rewardRect]);
    setRewardTapRect(
      scaleRectAroundCenter(padHole(rewardRect, 20 + 52 * FTUE_VISUAL_SCALE), 0.35),
    );
  }, [appScale]);

  useEffect(() => {
    if (!active) {
      setHoleRects(null);
      setRewardTapRect(null);
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
