/**
 * Offline Earnings – discovery-style layout with yellow "Double Coins" + green "Collect".
 */
import React, { useEffect, useState, useRef } from 'react';
import { assetPath } from '../utils/assetPath';

const LEAF_SPRITES = [assetPath('/assets/vfx/particle_leaf_1.png'), assetPath('/assets/vfx/particle_leaf_2.png')];

interface LeafParticle {
  id: number;
  sprite: string;
  angle: number;
  speed: number;
  rotationSpeed: number;
  initialRotation: number;
  size: number;
  delay: number;
  spawnX?: number;
  spawnY?: number;
  lifetime: number;
}

const POPUP_LEAF_COUNT = 40;
const POPUP_LEAF_MIN_LIFETIME_MS = 250;
const POPUP_LEAF_MAX_LIFETIME_MS = 1000;
const POPUP_WIDTH = 260;
const POPUP_HEIGHT = 320;

function createPopupLeaves(): LeafParticle[] {
  return Array.from({ length: POPUP_LEAF_COUNT }, (_, i) => {
    const perimeter = 2 * (POPUP_WIDTH + POPUP_HEIGHT);
    const pos = (i / POPUP_LEAF_COUNT) * perimeter + Math.random() * 40;
    let spawnX: number;
    let spawnY: number;
    let outwardAngle: number;
    if (pos < POPUP_WIDTH) {
      spawnX = pos - POPUP_WIDTH / 2;
      spawnY = -POPUP_HEIGHT / 2;
      outwardAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    } else if (pos < POPUP_WIDTH + POPUP_HEIGHT) {
      spawnX = POPUP_WIDTH / 2;
      spawnY = (pos - POPUP_WIDTH) - POPUP_HEIGHT / 2;
      outwardAngle = 0 + (Math.random() - 0.5) * 0.8;
    } else if (pos < 2 * POPUP_WIDTH + POPUP_HEIGHT) {
      spawnX = POPUP_WIDTH / 2 - (pos - POPUP_WIDTH - POPUP_HEIGHT);
      spawnY = POPUP_HEIGHT / 2;
      outwardAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    } else {
      spawnX = -POPUP_WIDTH / 2;
      spawnY = POPUP_HEIGHT / 2 - (pos - 2 * POPUP_WIDTH - POPUP_HEIGHT);
      outwardAngle = Math.PI + (Math.random() - 0.5) * 0.8;
    }
    return {
      id: i,
      sprite: LEAF_SPRITES[i % LEAF_SPRITES.length],
      angle: outwardAngle,
      speed: Math.random() * 600,
      rotationSpeed: (Math.random() - 0.5) * 540,
      initialRotation: Math.random() * 360,
      size: 20 + Math.random() * 20,
      lifetime: POPUP_LEAF_MIN_LIFETIME_MS + Math.random() * (POPUP_LEAF_MAX_LIFETIME_MS - POPUP_LEAF_MIN_LIFETIME_MS),
      delay: 0,
      spawnX,
      spawnY,
    };
  });
}

export interface OfflineEarningsPopupProps {
  isVisible: boolean;
  onClose: () => void;
  rewardAmount: number;
  /** Increment to replay reward row bounce (e.g. after doubling). */
  rewardBounceKey: number;
  showDoubleButton: boolean;
  onDoubleCoinsClick: () => void;
  onCollectClick: (startPoint: { x: number; y: number }) => void;
  appScale?: number;
}

const formatCoins = (amount: number): string => {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
  return Math.floor(amount).toString();
};

export const OfflineEarningsPopup: React.FC<OfflineEarningsPopupProps> = ({
  isVisible,
  onClose,
  rewardAmount,
  rewardBounceKey,
  showDoubleButton,
  onDoubleCoinsClick,
  onCollectClick,
  appScale = 1,
}) => {
  const [animState, setAnimState] = useState<'hidden' | 'entering' | 'visible' | 'leaving'>('hidden');
  const [assetsReady, setAssetsReady] = useState(false);
  const [leaves, setLeaves] = useState<LeafParticle[]>([]);
  const [leafPositions, setLeafPositions] = useState<{ x: number; y: number; opacity: number; rotation: number; scale: number }[]>([]);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const [doublePressed, setDoublePressed] = useState(false);
  const [collectPressed, setCollectPressed] = useState(false);
  const rewardCoinRef = useRef<HTMLImageElement>(null);
  const collectButtonRef = useRef<HTMLButtonElement>(null);
  const leafRafRef = useRef<number>(0);
  const leafStartTimeRef = useRef<number>(0);
  const leafPosRef = useRef<{ x: number; y: number; vx: number; vy: number; opacity: number; rotation: number; scale: number; started: boolean }[]>([]);
  const [rewardBounceActive, setRewardBounceActive] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setAssetsReady(false);
      return;
    }
    const bgImg = new Image();
    bgImg.src = assetPath('/assets/popups/popup_background.png?v=2');
    if (bgImg.complete) setAssetsReady(true);
    else {
      bgImg.onload = () => setAssetsReady(true);
      bgImg.onerror = () => setAssetsReady(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (rewardBounceKey <= 0) return;
    setRewardBounceActive(true);
    const t = window.setTimeout(() => setRewardBounceActive(false), 600);
    return () => clearTimeout(t);
  }, [rewardBounceKey]);

  useEffect(() => {
    if (leaves.length === 0) return;
    const tick = () => {
      const elapsed = Date.now() - leafStartTimeRef.current;
      const allDone = leaves.every((leaf) => {
        const leafElapsed = elapsed - leaf.delay;
        return leafElapsed > leaf.lifetime + 100;
      });
      if (allDone) {
        setLeaves([]);
        return;
      }
      leafPosRef.current.forEach((p, i) => {
        const leaf = leaves[i];
        if (!leaf) return;
        const leafElapsed = elapsed - leaf.delay;
        if (leafElapsed < 0) return;
        if (leafElapsed > leaf.lifetime) {
          p.opacity = 0;
          return;
        }
        if (!p.started) {
          p.started = true;
          p.vx = Math.cos(leaf.angle) * leaf.speed;
          p.vy = Math.sin(leaf.angle) * leaf.speed;
        }
        const dtSec = 1 / 60;
        const gravity = 60;
        const drag = 0.92;
        p.vy += gravity * dtSec;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dtSec;
        p.y += p.vy * dtSec;
        p.rotation = leaf.initialRotation + (leafElapsed / 1000) * leaf.rotationSpeed;
        const fadeStart = leaf.lifetime * 0.5;
        const fadeDuration = leaf.lifetime * 0.5;
        p.opacity = leafElapsed < fadeStart ? 1 : Math.max(0, 1 - (leafElapsed - fadeStart) / fadeDuration);
        p.scale = 1 - 0.2 * Math.min(1, leafElapsed / leaf.lifetime);
      });
      setLeafPositions(leafPosRef.current.map((p) => ({ x: p.x, y: p.y, opacity: p.opacity, rotation: p.rotation, scale: p.scale })));
      leafRafRef.current = requestAnimationFrame(tick);
    };
    leafRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(leafRafRef.current);
  }, [leaves]);

  useEffect(() => {
    if (isVisible && assetsReady && animState === 'hidden') {
      const newLeaves = createPopupLeaves();
      setLeaves(newLeaves);
      leafStartTimeRef.current = Date.now();
      leafPosRef.current = newLeaves.map((leaf) => ({
        x: leaf.spawnX ?? 0,
        y: leaf.spawnY ?? 0,
        vx: 0,
        vy: 0,
        opacity: 1,
        rotation: 0,
        scale: 1,
        started: false,
      }));
      setLeafPositions(newLeaves.map((leaf) => ({ x: leaf.spawnX ?? 0, y: leaf.spawnY ?? 0, opacity: 1, rotation: 0, scale: 1 })));
      setImgFailed({});
      setAnimState('entering');
      setTimeout(() => setAnimState('visible'), 250);
    } else if (!isVisible && (animState === 'visible' || animState === 'entering')) {
      setAnimState('leaving');
      setTimeout(() => {
        setAnimState('hidden');
        onClose();
      }, 150);
    }
  }, [isVisible, assetsReady, animState, onClose]);

  const [isClosing, setIsClosing] = useState(false);

  const handleCollect = () => {
    if (isClosing) return;
    setIsClosing(true);
    if (rewardCoinRef.current) {
      const r = rewardCoinRef.current.getBoundingClientRect();
      onCollectClick({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    } else if (collectButtonRef.current) {
      const r = collectButtonRef.current.getBoundingClientRect();
      onCollectClick({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, 150);
  };

  if (animState === 'hidden') return null;

  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';

  const subtitleColor = '#5c4a32';
  const collectBg = '#b8d458';
  const collectBorder = '#8fb33a';
  const collectText = '#4a6b1e';
  const collectPressedBg = '#9fc044';

  const yellowBg = '#ffd856';
  const yellowBorder = '#f59d42';
  const yellowPressed = '#f0c840';
  const yellowText = '#e6803a';

  const headerIconSrc = assetPath('/assets/icons/icon_happycustomer.png');

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      style={{ zIndex: 100, overflow: 'hidden', paddingTop: 'clamp(36px, 7vh, 80px)' }}
    >
      <div
        className="absolute transition-opacity duration-300"
        style={{
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          opacity: isLeaving ? 0 : 1,
        }}
      />

      <div
        className="relative flex items-center justify-center"
        style={{ transform: `scale(${appScale})`, transformOrigin: 'center center' }}
      >
        {(isEntering || animState === 'visible') && leaves.length > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: 1,
              height: 1,
              transform: 'translate(-50%, -50%)',
              zIndex: 101,
            }}
          >
            {leaves.map((leaf, i) => (
              <div
                key={leaf.id}
                className="absolute"
                style={{
                  left: leafPositions[i]?.x ?? 0,
                  top: leafPositions[i]?.y ?? 0,
                  width: leaf.size,
                  height: leaf.size,
                  transform: `translate(-50%, -50%) scale(${leafPositions[i]?.scale ?? 1}) rotate(${leafPositions[i]?.rotation ?? 0}deg)`,
                  opacity: leafPositions[i]?.opacity ?? 0,
                }}
              >
                {imgFailed[i] ? (
                  <div
                    className="w-full h-full rounded-sm"
                    style={{ background: 'linear-gradient(135deg, #4a7c23 0%, #6b8e23 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                  />
                ) : (
                  <img
                    src={leaf.sprite}
                    alt=""
                    className="w-full h-full object-contain"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                    onError={() => setImgFailed((prev) => ({ ...prev, [i]: true }))}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className="relative flex flex-col items-center"
          style={{
            width: '320px',
            zIndex: 102,
            animation: isEntering ? 'offlinePopupEnter 250ms ease-out forwards' : isLeaving ? 'offlinePopupLeave 150ms ease-in forwards' : 'none',
            transform: animState === 'visible' ? 'scale(1)' : undefined,
            opacity: animState === 'visible' ? 1 : undefined,
          }}
        >
          <style>{`
            @keyframes offlinePopupEnter {
              0% { transform: scale(0.9); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes offlinePopupLeave {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0; }
            }
            @keyframes offlineRewardBounce {
              0%, 100% { transform: scale(1); }
              35% { transform: scale(1.18); }
              55% { transform: scale(0.92); }
              75% { transform: scale(1.06); }
            }
          `}</style>

          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{ width: '120px', height: '120px', top: '-20px', zIndex: 104 }}
          >
            <img
              src={assetPath('/assets/popups/popup_header.png')}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
            />
            <img
              src={headerIconSrc}
              alt=""
              className="relative object-contain"
              style={{
                width: '94px',
                height: '94px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                marginTop: '-4px',
              }}
            />
          </div>

          <div
            style={{
              position: 'relative',
              marginTop: '36px',
              width: '640px',
              transform: 'scale(0.5)',
              transformOrigin: 'top center',
              marginBottom: '-290px',
            }}
          >
            <div
              style={{
                backgroundImage: `url(${assetPath('/assets/popups/popup_background.png?v=2')})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.3))',
                padding: '150px 40px 60px 40px',
              }}
            >
              <div className="flex flex-col items-center">
                <h2
                  className="font-normal text-center"
                  style={{ color: '#c2b280', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', fontSize: '2.25rem' }}
                >
                  Offline Earnings
                </h2>
                <h3
                  className="font-black tracking-tight text-center"
                  style={{
                    color: subtitleColor,
                    fontFamily: 'Inter, sans-serif',
                    marginTop: '-8px',
                    whiteSpace: 'nowrap',
                    fontSize: 'min(4.375rem, 72px)',
                  }}
                >
                  Welcome Back!
                </h3>
                <div className="w-full flex items-center justify-center" style={{ marginTop: '8px', marginBottom: '24px' }}>
                  <img src={assetPath('/assets/popups/popup_divider.png')} alt="" className="h-auto object-contain" style={{ width: '520px' }} />
                </div>
                <p
                  className="font-medium text-center leading-relaxed italic w-full"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    fontSize: '2rem',
                  }}
                >
                  You earned some coins whilst you were away.
                </p>

                <div
                  className="flex items-center justify-center"
                  style={{
                    marginTop: '20px',
                    animation: rewardBounceActive ? 'offlineRewardBounce 0.55s ease-out' : 'none',
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center"
                    style={{
                      backgroundColor: '#c3b381',
                      borderRadius: '999px',
                      padding: '10px 18px',
                      gap: '6px',
                    }}
                  >
                    <img
                      ref={rewardCoinRef}
                      src={assetPath('/assets/icons/icon_coin_small.png')}
                      alt=""
                      className="object-contain"
                      style={{ width: '40px', height: '40px' }}
                    />
                    <span
                      className="font-medium tracking-tight"
                      style={{ color: '#fcf0c7', fontFamily: 'Inter, sans-serif', fontSize: '2rem', lineHeight: 1 }}
                    >
                      {formatCoins(rewardAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex-grow min-h-[32px]" />

                {showDoubleButton && (
                  <button
                    type="button"
                    onMouseDown={() => setDoublePressed(true)}
                    onMouseUp={() => setDoublePressed(false)}
                    onMouseLeave={() => setDoublePressed(false)}
                    onClick={onDoubleCoinsClick}
                    className="relative flex items-center justify-center gap-3 rounded-xl transition-all"
                    style={{
                      width: '360px',
                      height: '88px',
                      marginBottom: '28px',
                      backgroundColor: doublePressed ? yellowPressed : yellowBg,
                      border: `4px solid ${yellowBorder}`,
                      borderRadius: '24px',
                      boxShadow: doublePressed
                        ? 'inset 0 4px 8px rgba(0,0,0,0.15)'
                        : `0 8px 0 ${yellowBorder}, 0 12px 24px rgba(0,0,0,0.15)`,
                      transform: doublePressed ? 'translateY(4px)' : 'translateY(0)',
                    }}
                  >
                    <img
                      src={assetPath('/assets/icons/icon_watchad.png')}
                      alt=""
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                        marginLeft: '-8px',
                        filter:
                          'brightness(0) saturate(100%) invert(56%) sepia(67%) saturate(1000%) hue-rotate(346deg) brightness(97%) contrast(88%)',
                      }}
                    />
                    <span
                      className="font-bold tracking-tight"
                      style={{
                        color: yellowText,
                        fontFamily: 'Inter, sans-serif',
                        textShadow: '0 2px 0 rgba(255,255,255,0.3)',
                        fontSize: '2rem',
                      }}
                    >
                      Double Coins
                    </span>
                  </button>
                )}

                <button
                  ref={collectButtonRef}
                  type="button"
                  onMouseDown={() => setCollectPressed(true)}
                  onMouseUp={() => setCollectPressed(false)}
                  onMouseLeave={() => setCollectPressed(false)}
                  onClick={handleCollect}
                  className="relative flex items-center justify-center rounded-xl transition-all"
                  style={{
                    width: '360px',
                    height: '88px',
                    marginTop: '4px',
                    marginBottom: '0px',
                    backgroundColor: collectPressed ? collectPressedBg : collectBg,
                    border: `4px solid ${collectBorder}`,
                    borderRadius: '24px',
                    boxShadow: collectPressed
                      ? 'inset 0 4px 8px rgba(0,0,0,0.15)'
                      : `0 8px 0 ${collectBorder}, 0 12px 24px rgba(0,0,0,0.15)`,
                    transform: collectPressed ? 'translateY(4px)' : 'translateY(0)',
                  }}
                >
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      color: collectText,
                      fontFamily: 'Inter, sans-serif',
                      textShadow: '0 2px 0 rgba(255,255,255,0.3)',
                      fontSize: '2rem',
                    }}
                  >
                    Collect
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
