/**
 * Full-screen Debug Menu — Infinity Arena horizontal-tabbed QA panel.
 * Mutations only via DebugHandlers (utils/debugActions.ts).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEBUG_MENU_TABS,
  DEBUG_MENU_TAB_LABELS,
  DEBUG_MENU_SEARCHABLE_TABS,
  type DebugMenuTabId,
} from '../constants/debugMenu';
import {
  actionsForTab,
  type DebugActionDef,
  type DebugHandlers,
} from '../utils/debugActions';
import { getDebugFpsCap } from '../utils/debugFpsCap';
import { getFarmVfxSnapshot } from '../utils/farmVfxStore';
import { getRemoteConfig } from '../utils/remoteConfig';
import { listDebugProfiles, saveDebugProfile, loadDebugProfile, deleteDebugProfile } from '../utils/debugProfiles';

export type DebugMenuStats = {
  money: number;
  keys: number;
  playerLevel: number;
  gardenLabel: string;
  fpsHint?: number;
};

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onUserDismiss?: () => void;
  onAnyButtonClick?: () => void;
  handlers: DebugHandlers;
  stats: DebugMenuStats;
};

const CONFIRM_WINDOW_MS = 2800;

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  return String(Math.floor(n));
}

function modeBadge(mode: DebugActionDef['mode']): { text: string; color: string; bg: string } {
  if (mode === 'normal') return { text: 'Normal Rules', color: '#4a6b1e', bg: '#d4e89a' };
  return { text: 'Force State', color: '#6b2a2a', bg: '#f0c0c0' };
}

const LiveFps: React.FC<{ onFps?: (n: number) => void }> = ({ onFps }) => {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let start = performance.now();
    const tick = (now: number) => {
      frames += 1;
      if (now - start >= 500) {
        const v = Math.round((frames * 1000) / (now - start));
        setFps(v);
        onFps?.(v);
        frames = 0;
        start = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onFps]);
  return <span>{fps} FPS</span>;
};

export const DebugMenu: React.FC<Props> = ({
  isVisible,
  onClose,
  onUserDismiss,
  onAnyButtonClick,
  handlers,
  stats,
}) => {
  const [tab, setTab] = useState<DebugMenuTabId>('profiles');
  const [query, setQuery] = useState('');
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);
  const confirmTimerRef = useRef<number | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profilesTick, setProfilesTick] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [fpsCapLocal, setFpsCapLocal] = useState<number>(() => getDebugFpsCap() ?? 60);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setPendingConfirmId(null);
      setQuery('');
      setStatusMsg('');
    }
  }, [isVisible]);

  const flash = useCallback((msg: string) => {
    setStatusMsg(msg);
    window.setTimeout(() => setStatusMsg((cur) => (cur === msg ? '' : cur)), 2200);
  }, []);

  const runAction = useCallback(
    (action: DebugActionDef) => {
      onAnyButtonClick?.();
      if (action.destructive) {
        if (pendingConfirmId !== action.id) {
          setPendingConfirmId(action.id);
          if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
          confirmTimerRef.current = window.setTimeout(() => setPendingConfirmId(null), CONFIRM_WINDOW_MS);
          flash('Tap again to confirm');
          return;
        }
        setPendingConfirmId(null);
      }

      const fn = handlers[action.run];
      if (typeof fn !== 'function') return;

      // Special-cased payloads
      if (action.run === 'addCoins') (fn as (n: number) => void)(1_000_000);
      else if (action.run === 'addKeys') (fn as (n: number) => void)(10);
      else (fn as () => void)();

      if (action.tab === 'profiles' || action.tab === 'presets' || action.tab === 'reset') {
        setProfilesTick((n) => n + 1);
      }
      flash(action.label);
    },
    [handlers, onAnyButtonClick, pendingConfirmId, flash],
  );

  const actions = useMemo(
    () => actionsForTab(tab, DEBUG_MENU_SEARCHABLE_TABS.has(tab) ? query : '', handlers),
    [tab, query, handlers, tick, profilesTick],
  );

  const profiles = useMemo(() => listDebugProfiles(), [profilesTick, isVisible]);
  const rc = getRemoteConfig();
  const vfx = getFarmVfxSnapshot();
  const entityCount =
    vfx.leafBursts.length +
    vfx.leafBurstsSmall.length +
    vfx.unlockBursts.length +
    vfx.buttonLeafBursts.length +
    vfx.goalCoinLeafBursts.length;

  const now = Date.now();
  void now;
  void tick;

  if (!isVisible) return null;

  const bypassOn = handlers.getInterstitialBypass();
  const hapOn = handlers.getHapticsEnabled();
  const perfOn = handlers.getPerformanceMode();
  const notchOn = handlers.getFakeNotch();
  const fpsCap = handlers.getFpsCap();

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        zIndex: 200,
        background: '#1a1510',
        color: '#f5ecd8',
        fontFamily: 'Inter, sans-serif',
        // Parent modal portal is pointer-events-none; must re-enable or taps fall through to Settings backdrop.
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ padding: '10px 12px', borderBottom: '1px solid #3d3428', background: '#241e18' }}
      >
        <div>
          <div className="font-black text-sm tracking-wide" style={{ color: '#f0e0b8' }}>
            Debug Menu
          </div>
          {statusMsg ? (
            <div className="text-[10px]" style={{ color: '#b8d458' }}>
              {statusMsg}
            </div>
          ) : (
            <div className="text-[10px]" style={{ color: '#8a7a60' }}>
              QA panel · second tap confirms destructive
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onUserDismiss?.();
            onClose();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: '#3d3428', color: '#e8dcc0', border: '1px solid #5c4a32' }}
        >
          Close
        </button>
      </div>

      {/* Stats strip */}
      <div
        className="flex gap-2 overflow-x-auto shrink-0"
        style={{ padding: '8px 10px', borderBottom: '1px solid #3d3428' }}
      >
        {[
          { k: 'Coins', v: formatMoney(stats.money) },
          { k: 'Keys', v: String(stats.keys) },
          { k: 'Level', v: String(stats.playerLevel) },
          { k: 'Garden', v: stats.gardenLabel },
          { k: 'FPS', v: <LiveFps /> },
          { k: 'VFX', v: String(entityCount) },
        ].map((pill) => (
          <div
            key={pill.k}
            className="shrink-0 rounded-full px-2.5 py-1"
            style={{ background: '#2e261e', border: '1px solid #4a3f32' }}
          >
            <span className="text-[9px] uppercase tracking-wide" style={{ color: '#8a7a60' }}>
              {pill.k}{' '}
            </span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: '#f5ecd8' }}>
              {pill.v}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1.5 overflow-x-auto shrink-0"
        style={{ padding: '8px 10px', borderBottom: '1px solid #3d3428' }}
      >
        {DEBUG_MENU_TABS.map((id) => {
          const active = id === tab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setQuery('');
                setPendingConfirmId(null);
              }}
              className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold whitespace-nowrap"
              style={{
                background: active ? '#b8d458' : '#2e261e',
                color: active ? '#2a3a12' : '#d4c4a0',
                border: `1px solid ${active ? '#8fb33a' : '#4a3f32'}`,
              }}
            >
              {DEBUG_MENU_TAB_LABELS[id]}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: '10px 12px 24px' }}>
        {DEBUG_MENU_SEARCHABLE_TABS.has(tab) ? (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions…"
            className="w-full mb-3 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: '#2e261e', border: '1px solid #4a3f32', color: '#f5ecd8' }}
          />
        ) : null}

        {tab === 'performance' ? (
          <div className="mb-4 space-y-3">
            <div className="text-xs" style={{ color: '#a89878' }}>
              Live: <LiveFps /> · VFX entities: {entityCount} · Cap:{' '}
              {fpsCap == null ? 'default' : `${fpsCap} FPS`} · Perf mode: {perfOn ? 'ON' : 'OFF'}
            </div>
            <label className="block text-xs font-bold" style={{ color: '#d4c4a0' }}>
              FPS cap (20–60, step 5)
              <input
                type="range"
                min={20}
                max={60}
                step={5}
                value={fpsCapLocal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setFpsCapLocal(v);
                  handlers.setFpsCap(v);
                }}
                className="w-full mt-1"
              />
            </label>
            <button
              type="button"
              className="text-xs font-bold px-3 py-2 rounded-lg"
              style={{ background: '#3d3428', color: '#e8dcc0' }}
              onClick={() => {
                handlers.setFpsCap(null);
                setFpsCapLocal(60);
                flash('FPS cap cleared');
              }}
            >
              Clear FPS override
            </button>
            <button
              type="button"
              className="ml-2 text-xs font-bold px-3 py-2 rounded-lg"
              style={{ background: perfOn ? '#b8d458' : '#3d3428', color: perfOn ? '#2a3a12' : '#e8dcc0' }}
              onClick={() => {
                onAnyButtonClick?.();
                handlers.togglePerformanceMode();
                flash('Performance mode toggled');
              }}
            >
              Performance Mode: {perfOn ? 'ON' : 'OFF'}
            </button>
          </div>
        ) : null}

        {tab === 'profiles' ? (
          <div className="mb-4 space-y-2">
            <div className="flex gap-2">
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Snapshot name"
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#2e261e', border: '1px solid #4a3f32', color: '#f5ecd8' }}
              />
              <button
                type="button"
                className="text-xs font-bold px-3 py-2 rounded-lg"
                style={{ background: '#b8d458', color: '#2a3a12' }}
                onClick={() => {
                  onAnyButtonClick?.();
                  if (saveDebugProfile(profileName)) {
                    setProfileName('');
                    setProfilesTick((n) => n + 1);
                    flash('Profile saved');
                  } else flash('No save to snapshot');
                }}
              >
                Save
              </button>
            </div>
            {profiles.length === 0 ? (
              <div className="text-xs" style={{ color: '#8a7a60' }}>
                No named snapshots yet.
              </div>
            ) : (
              profiles.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-2 rounded-lg px-2 py-2"
                  style={{ background: '#2e261e', border: '1px solid #4a3f32' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{p.name}</div>
                    <div className="text-[10px]" style={{ color: '#8a7a60' }}>
                      {new Date(p.savedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-[10px] font-bold px-2 py-1 rounded"
                    style={{ background: '#89c8e1', color: '#1a4058' }}
                    onClick={() => {
                      onAnyButtonClick?.();
                      loadDebugProfile(p.name);
                    }}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="text-[10px] font-bold px-2 py-1 rounded"
                    style={{ background: '#a84848', color: '#fce8e8' }}
                    onClick={() => {
                      onAnyButtonClick?.();
                      deleteDebugProfile(p.name);
                      setProfilesTick((n) => n + 1);
                    }}
                  >
                    Del
                  </button>
                </div>
              ))
            )}
          </div>
        ) : null}

        {tab === 'ads' ? (
          <div className="mb-3 text-xs space-y-1" style={{ color: '#a89878' }}>
            <div>Interstitial bypass: {bypassOn ? 'ON (ads disabled)' : 'OFF'}</div>
            <div>
              Gap {Math.round(rc.ads.interstitialCooldownMs / 1000)}s · after rewarded{' '}
              {Math.round(rc.ads.interstitialCooldownAfterRewardedMs / 1000)}s · max interval{' '}
              {Math.round(rc.ads.interstitialMaxIntervalMs / 1000)}s · store free{' '}
              {Math.round(rc.ads.specialOffer.storeFreeOfferCooldownMs / 60000)}m
            </div>
          </div>
        ) : null}

        {tab === 'haptics' ? (
          <div className="mb-3 text-xs" style={{ color: '#a89878' }}>
            Haptics: {hapOn ? 'ON' : 'OFF'} (mirrors Settings)
          </div>
        ) : null}

        {tab === 'remote' ? (
          <div className="mb-3 text-xs space-y-1" style={{ color: '#a89878' }}>
            <div>Fetch: local defaults only (Firebase TODO)</div>
            <div>
              Ads enabled: {String(rc.ads.enabled)} · offline hours:{' '}
              {rc.currency.maxOfflineEarningsHours}
            </div>
          </div>
        ) : null}

        {tab === 'game' ? (
          <div className="mb-3 text-xs" style={{ color: '#a89878' }}>
            Fake notch: {notchOn ? 'ON' : 'OFF'} · Special Delivery / garden cheats live under Progress
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {actions.map((action) => {
            const badge = modeBadge(action.mode);
            const confirming = pendingConfirmId === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => runAction(action)}
                className="w-full text-left rounded-xl px-3 py-2.5 active:scale-[0.99] transition-transform"
                style={{
                  background: confirming ? '#5a3028' : '#2e261e',
                  border: `1px solid ${confirming ? '#c07060' : '#4a3f32'}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: '#f5ecd8' }}>
                    {confirming ? `Confirm: ${action.label}` : action.label}
                  </span>
                  <span
                    className="shrink-0 text-[9px] font-extrabold uppercase tracking-wide rounded-full px-2 py-0.5"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.text}
                  </span>
                </div>
              </button>
            );
          })}
          {actions.length === 0 ? (
            <div className="text-xs" style={{ color: '#8a7a60' }}>
              No actions match.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
