import React, { useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';

const PANEL_BG = '#fcf0c6';
const PANEL_HEIGHT_PX = 25.2;
const OPEN_MS = 220;
const HOLD_AFTER_BURST_MS = 1000;
const FADE_MS = 180;

type BadgePhase = 'hidden' | 'collapsed' | 'open' | 'closing' | 'fading';

interface CollectionKeyBadgeProps {
  targetRef: React.RefObject<HTMLButtonElement | null>;
  activeParticleCount: number;
  impactVersion: number;
  keyCount: number;
  /**
   * When set (e.g. garden-1 intro trio goal of 30), badge text is `n/goal`
   * instead of just `n`.
   */
  goalTotal?: number | null;
}

export const CollectionKeyBadge: React.FC<CollectionKeyBadgeProps> = ({
  targetRef,
  activeParticleCount,
  impactVersion,
  keyCount,
  goalTotal = null,
}) => {
  const [phase, setPhase] = useState<BadgePhase>('hidden');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const previousActiveCountRef = useRef(0);
  const phaseRef = useRef<BadgePhase>('hidden');
  const hasOpenedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  };

  const setBadgePhase = (next: BadgePhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    const previousCount = previousActiveCountRef.current;
    previousActiveCountRef.current = activeParticleCount;

    if (activeParticleCount > 0) {
      // New or continuing keys — cancel any pending close and keep the session alive.
      clearTimers();

      if (previousCount === 0) {
        const buttonRect = targetRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setPosition({
            x: buttonRect.left + buttonRect.width / 2,
            y: buttonRect.top,
          });
        }

        const current = phaseRef.current;
        if (current === 'open' || current === 'closing' || current === 'fading') {
          // Already visible from a previous claim — stay/reopen; wait for next impacts to tick the count.
          hasOpenedRef.current = true;
          setBadgePhase('open');
        } else {
          // Fresh session — wait for the first key impact before expanding.
          hasOpenedRef.current = false;
          setBadgePhase('collapsed');
        }
      }
      return;
    }

    // All keys finished: only close after 1s with no further claims/particles.
    if (previousCount <= 0) return;
    if (phaseRef.current === 'hidden' || phaseRef.current === 'collapsed') return;

    timersRef.current = [
      window.setTimeout(() => {
        setBadgePhase('closing');
        timersRef.current.push(
          window.setTimeout(() => {
            setBadgePhase('fading');
            timersRef.current.push(
              window.setTimeout(() => setBadgePhase('hidden'), FADE_MS),
            );
          }, OPEN_MS),
        );
      }, HOLD_AFTER_BURST_MS),
    ];
  }, [activeParticleCount, targetRef]);

  useEffect(() => {
    if (activeParticleCount <= 0) return;
    // First impact of a fresh session expands the cream panel.
    if (!hasOpenedRef.current) {
      hasOpenedRef.current = true;
      setBadgePhase('open');
      return;
    }
    // Later impacts (or a new batch while already open) just keep it open.
    if (phaseRef.current === 'closing' || phaseRef.current === 'fading') {
      clearTimers();
      setBadgePhase('open');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impactVersion]);

  if (phase === 'hidden') return null;

  const isWide = phase === 'open';
  const isClosingOrFading = phase === 'closing' || phase === 'fading';
  const countLabel =
    goalTotal != null && goalTotal > 0 ? `${keyCount}/${goalTotal}` : String(keyCount);
  const panelWidth = Math.max(50.4, (44 + countLabel.length * 9) * 0.9);

  return (
    <div
      className="fixed flex items-center justify-center pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        width: isWide ? panelWidth : 0,
        height: PANEL_HEIGHT_PX,
        transform: 'translate(-50%, -50%)',
        borderRadius: PANEL_HEIGHT_PX / 2,
        backgroundColor: PANEL_BG,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        opacity: isClosingOrFading ? 0 : 1,
        overflow: 'hidden',
        transition: [
          `width ${OPEN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          `opacity ${OPEN_MS * 0.5}ms ease-out`,
        ].join(', '),
        zIndex: 604,
      }}
      aria-hidden
    >
      <div
        className="flex items-center justify-center"
        style={{
          gap: 4.5,
          padding: '6px 8px 6px 3px',
          opacity: isWide ? 1 : 0,
          transform: `scale(${isWide ? 0.88 : 0})`,
          transition: `opacity ${OPEN_MS}ms ease, transform ${OPEN_MS}ms ease`,
          whiteSpace: 'nowrap',
        }}
      >
        <img
          src={assetPath('/assets/icons/coins/icon_key.png')}
          alt=""
          className="shrink-0 object-contain"
          style={{ width: 22.5, height: 22.5 }}
        />
        <span
          className="font-black tabular-nums leading-none"
          style={{ color: '#583c1f', letterSpacing: '-0.04em', fontSize: 16.5 }}
        >
          {countLabel}
        </span>
      </div>
    </div>
  );
};
