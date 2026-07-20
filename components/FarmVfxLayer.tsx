/**
 * Renders farm burst VFX from farmVfxStore — isolated so App/HexBoard do not re-render on spawn.
 */
import React, { useSyncExternalStore } from 'react';
import { LeafBurst, LEAF_BURST_BASELINE_COUNT, LEAF_BURST_SMALL_COUNT } from './LeafBurst';
import { UnlockBurst } from './UnlockBurst';
import { ButtonLeafBurst } from './ButtonLeafBurst';
import { ShelfUnlockConeBurst } from './ShelfUnlockConeBurst';
import {
  getFarmVfxSnapshot,
  removeButtonLeafBurst,
  removeGoalCoinLeafBurst,
  removeLeafBurst,
  removeLeafBurstSmall,
  removeMasteryConeBurst,
  removeUnlockBurst,
  subscribeFarmVfx,
} from '../utils/farmVfxStore';

export interface FarmVfxLayerProps {
  appScale: number;
}

export const FarmVfxLayer: React.FC<FarmVfxLayerProps> = ({ appScale }) => {
  const {
    leafBursts,
    leafBurstsSmall,
    unlockBursts,
    masteryPurchaseConeBursts,
    buttonLeafBursts,
    goalCoinLeafBursts,
  } = useSyncExternalStore(subscribeFarmVfx, getFarmVfxSnapshot, getFarmVfxSnapshot);

  return (
    <>
      {leafBursts.map((b) => (
        <LeafBurst
          key={b.id}
          x={b.x}
          y={b.y}
          startTime={b.startTime}
          appScale={appScale}
          onComplete={() => removeLeafBurst(b.id)}
        />
      ))}
      {leafBurstsSmall.map((b) => (
        <LeafBurst
          key={b.id}
          x={b.x}
          y={b.y}
          startTime={b.startTime}
          particleCount={b.particleCount ?? LEAF_BURST_SMALL_COUNT}
          useCircle={b.useCircle}
          burstScale={b.burstScale}
          appScale={appScale}
          onComplete={() => removeLeafBurstSmall(b.id)}
        />
      ))}
      {masteryPurchaseConeBursts.map((b) => (
        <ShelfUnlockConeBurst
          key={b.id}
          x={b.x}
          y={b.y}
          startTime={b.startTime}
          scale={1.35}
          particleCount={26}
          onComplete={() => removeMasteryConeBurst(b.id)}
        />
      ))}
      {unlockBursts.map((b) => (
        <UnlockBurst
          key={b.id}
          x={b.x}
          y={b.y}
          startTime={b.startTime}
          appScale={appScale}
          onComplete={() => removeUnlockBurst(b.id)}
        />
      ))}
      {buttonLeafBursts.map((b) => (
        <ButtonLeafBurst
          key={b.id}
          x={b.x}
          y={b.y}
          startTime={b.startTime}
          radiusScale={b.radiusScale}
          speedScale={b.speedScale}
          appScale={appScale}
          onComplete={() => removeButtonLeafBurst(b.id)}
        />
      ))}
      {goalCoinLeafBursts.map((b) => (
        <LeafBurst
          key={b.id}
          x={b.x}
          y={b.y}
          startTime={b.startTime}
          particleCount={LEAF_BURST_BASELINE_COUNT}
          appScale={appScale}
          spriteVariant={b.spriteVariant ?? 'gold'}
          burstScale={1.25}
          onComplete={() => removeGoalCoinLeafBurst(b.id)}
        />
      ))}
    </>
  );
};
