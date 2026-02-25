
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HexBoard } from './components/HexBoard';
import { UpgradeTabs } from './components/UpgradeTabs';
import { UpgradeList, createInitialSeedsState, createInitialHarvestState, getSeedQualityPercent, getSeedBaseTier, getBonusSeedChance, getSeedSurplusValue, HarvestState } from './components/UpgradeList';
import { Navbar } from './components/Navbar';
import { StoreScreen } from './components/StoreScreen';
import { SideAction } from './components/SideAction';
import { Projectile } from './components/Projectile';
import { LeafBurst, LEAF_BURST_SMALL_COUNT } from './components/LeafBurst';
import { CoinPanel, CoinPanelData } from './components/CoinPanel';
import { WalletImpactBurst } from './components/WalletImpactBurst';
import { PageHeader } from './components/PageHeader';
import { TabType, ScreenType, BoardCell, Item, DragState } from './types';

/** Coin per plant level: level 1 = 5, level 2 = 10, level 3 = 20, ... */
export function getCoinValueForLevel(level: number): number {
  return 5 * Math.pow(2, level - 1);
}
import { ErrorBoundary } from './components/ErrorBoundary';
const generateInitialGrid = (): BoardCell[] => {
  const cells: BoardCell[] = [];
  for (let q = -2; q <= 2; q++) {
    const r1 = Math.max(-2, -q - 2);
    const r2 = Math.min(2, -q + 2);
    for (let r = r1; r <= r2; r++) {
      cells.push({ q, r, item: null });
    }
  }
  return cells;
};

export interface ProjectileData {
  id: string;
  startX: number;
  startY: number;
  targetIdx: number;
  plantLevel: number; // The level of plant to spawn on impact
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('SEEDS');
  const [activeScreen, setActiveScreen] = useState<ScreenType>('FARM');
  const [isExpanded, setIsExpanded] = useState(true);
  const [money, setMoney] = useState(100000);

  const [grid, setGrid] = useState<BoardCell[]>(generateInitialGrid());
  const [seedProgress, setSeedProgress] = useState(0);
  const [harvestProgress, setHarvestProgress] = useState(0);
  const [isSeedFlashing, setIsSeedFlashing] = useState(false);
  const [isHarvestFlashing, setIsHarvestFlashing] = useState(false);
  const [seedsState, setSeedsState] = useState(createInitialSeedsState);
  const [harvestState, setHarvestState] = useState<HarvestState>(createInitialHarvestState);
  const [seedsInStorage, setSeedsInStorage] = useState(0);
  const [seedBounceTrigger, setSeedBounceTrigger] = useState(0); // increment each 100% so bounce animation re-runs

  const seedStorageLevel = seedsState?.seed_storage?.level ?? 0;
  const seedStorageMax = 1 + seedStorageLevel; // +1 storage per upgrade
  const seedBaseTier = getSeedBaseTier(seedsState); // Current base tier for plant icon
  
  const [activeProjectiles, setActiveProjectiles] = useState<ProjectileData[]>([]);
  const [impactCellIdx, setImpactCellIdx] = useState<number | null>(null);
  const [returnImpactCellIdx, setReturnImpactCellIdx] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [sourceCellFadeOutIdx, setSourceCellFadeOutIdx] = useState<number | null>(null);
  const [newCellImpactIdx, setNewCellImpactIdx] = useState<number | null>(null);
  const [leafBursts, setLeafBursts] = useState<{ id: string; x: number; y: number; startTime: number }[]>([]);
  const [leafBurstsSmall, setLeafBurstsSmall] = useState<{ id: string; x: number; y: number; startTime: number }[]>([]);
  const [activeCoinPanels, setActiveCoinPanels] = useState<CoinPanelData[]>([]);
  const [harvestBounceCellIndices, setHarvestBounceCellIndices] = useState<number[]>([]);
  const [walletFlashActive, setWalletFlashActive] = useState(false);
  const [walletBursts, setWalletBursts] = useState<{ id: number; trigger: number }[]>([]);
  const nextWalletBurstIdRef = useRef(0);
  const walletFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plantButtonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const farmColumnRef = useRef<HTMLDivElement>(null);
  const hexAreaRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLButtonElement>(null);
  const walletIconRef = useRef<HTMLSpanElement>(null);

  const [spriteCenter, setSpriteCenter] = useState({ x: 50, y: 50 }); // % relative to column, for sprite center

  const updateSpriteCenter = useCallback(() => {
    const col = farmColumnRef.current;
    const area = hexAreaRef.current;
    if (!col || !area) return;
    const colRect = col.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    const centerX = (areaRect.left + areaRect.width / 2 - colRect.left) / colRect.width * 100;
    const centerY = (areaRect.top + areaRect.height / 2 - colRect.top) / colRect.height * 100;
    setSpriteCenter({ x: centerX, y: centerY });
  }, []);

  useEffect(() => {
    updateSpriteCenter();
    const col = farmColumnRef.current;
    const area = hexAreaRef.current;
    if (!col || !area) return;
    const ro = new ResizeObserver(updateSpriteCenter);
    ro.observe(col);
    ro.observe(area);
    return () => ro.disconnect();
  }, [updateSpriteCenter]);

  // When panel opens/closes, drive sprite position every frame for 500ms to match upgrade panel transition
  useEffect(() => {
    let rafId: number;
    let endAt = 0;
    const tick = () => {
      if (Date.now() < endAt) {
        updateSpriteCenter();
        rafId = requestAnimationFrame(tick);
      }
    };
    endAt = Date.now() + 500;
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isExpanded, updateSpriteCenter]);

  const isGridFull = grid.every(cell => cell.item !== null);

  const spawnProjectile = useCallback((targetIdx: number, plantLevel: number) => {
    if (plantButtonRef.current && containerRef.current) {
      const btnRect = plantButtonRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const startX = (btnRect.left + btnRect.width / 2) - containerRect.left;
      const startY = (btnRect.top + btnRect.height / 2) - containerRect.top;
      
      const newProj: ProjectileData = {
        id: Math.random().toString(36).substr(2, 9),
        startX,
        startY,
        targetIdx,
        plantLevel
      };
      setActiveProjectiles(prev => [...prev, newProj]);
    }
  }, []);

  // Seed Production upgrade: auto-increase progress when level >= 1. Rate = level completions per minute (+1/min per upgrade).
  const seedProductionLevel = seedsState?.seed_production?.level ?? 0;
  const lastSeedProgressTimeRef = useRef<number>(0);
  const seedProgressRef = useRef<number>(0);
  const tapZoomRef = useRef<{ start: number; end: number; startTime: number; duration: number } | null>(null);
  const [tapZoomTrigger, setTapZoomTrigger] = useState(0);

  // Tap zoom: animate +20% over a very short duration (fast smooth zoom)
  useEffect(() => {
    const zoom = tapZoomRef.current;
    if (!zoom) return;
    let rafId: number;
    const durationMs = 100;
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const tick = () => {
      const zoom = tapZoomRef.current;
      if (!zoom) return;
      const elapsed = Date.now() - zoom.startTime;
      const t = Math.min(1, elapsed / durationMs);
      const alpha = easeOutCubic(t);
      const value = zoom.start + (zoom.end - zoom.start) * alpha;
      seedProgressRef.current = value;
      if (t >= 1) {
        seedProgressRef.current = zoom.end;
        tapZoomRef.current = null;
        if (zoom.end >= 100) {
          setSeedProgress(100);
          setIsSeedFlashing(true);
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [tapZoomTrigger]);

  // Only update React state when we hit 100% or reset; progress bar is driven at 60fps via progressRef in SideAction
  useEffect(() => {
    if (seedProductionLevel < 1) return;
    lastSeedProgressTimeRef.current = Date.now();
    let rafId: number;
    const perMinute = seedProductionLevel; // 1/min per upgrade level
    const percentPerMs = (perMinute * 100) / (60 * 1000); // % progress per millisecond
    const tick = () => {
      if (tapZoomRef.current) {
        lastSeedProgressTimeRef.current = Date.now();
        rafId = requestAnimationFrame(tick);
        return;
      }
      const now = Date.now();
      let deltaMs = now - lastSeedProgressTimeRef.current;
      lastSeedProgressTimeRef.current = now;
      deltaMs = Math.min(deltaMs, 50); // cap for tab backgrounding
      const added = deltaMs * percentPerMs;
      const next = Math.min(100, seedProgressRef.current + added);
      seedProgressRef.current = next;
      if (next >= 100) {
        setSeedProgress(100);
        setIsSeedFlashing(true);
        setSeedBounceTrigger((t) => t + 1); // increment so bounce re-runs every revolution
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [seedProductionLevel]);

  /**
   * At 100% seed progress: add one seed to storage (if room), reset to 0% immediately.
   * If storage is full and seed_surplus is upgraded, spawn a coin panel instead.
   */
  useEffect(() => {
    if (seedProgress !== 100 || !isSeedFlashing) return;
    seedProgressRef.current = 0;
    setSeedProgress(0);
    setTimeout(() => setIsSeedFlashing(false), 300);
    
    // Check if storage is full BEFORE we would add
    const isStorageFull = seedsInStorage >= seedStorageMax;
    const surplusValue = getSeedSurplusValue(seedsState);
    
    if (isStorageFull && surplusValue > 0) {
      // Storage full with seed surplus upgrade: spawn coin panel
      const container = containerRef.current;
      const plantBtn = plantButtonRef.current;
      const walletIcon = walletIconRef.current;
      const wallet = walletRef.current;
      const walletEl = walletIcon || wallet;
      
      if (container && plantBtn && walletEl) {
        const containerRect = container.getBoundingClientRect();
        const btnRect = plantBtn.getBoundingClientRect();
        
        const startX = btnRect.left + btnRect.width / 2 - containerRect.left;
        const startY = btnRect.top + btnRect.height / 2 - containerRect.top;
        const hoverX = startX;
        const panelHeightPx = 14;
        const offsetUp = (panelHeightPx / 2 + 4) * 1.2;
        const hoverY = btnRect.top - containerRect.top - offsetUp;
        
        setActiveCoinPanels((prev) => [
          ...prev,
          {
            id: `seed-surplus-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            value: surplusValue,
            startX,
            startY,
            hoverX,
            hoverY,
            moveToWalletDelayMs: 0,
          },
        ]);
      }
    } else {
      // Normal case: add seed to storage
      setSeedsInStorage((prev) => Math.min(seedStorageMax, prev + 1));
    }
  }, [seedProgress, isSeedFlashing, seedStorageMax, seedsInStorage, seedsState]);

  // Harvest Speed upgrade: auto-increase progress when level >= 1. Rate = level completions per minute (+1/min per upgrade).
  const harvestSpeedLevel = harvestState?.harvest_speed?.level ?? 0;
  const lastHarvestProgressTimeRef = useRef<number>(0);
  const harvestProgressRef = useRef<number>(0);
  const harvestTapZoomRef = useRef<{ start: number; end: number; startTime: number; duration: number } | null>(null);
  const [harvestTapZoomTrigger, setHarvestTapZoomTrigger] = useState(0);

  // Harvest tap zoom: animate +20% over a very short duration (fast smooth zoom)
  useEffect(() => {
    const zoom = harvestTapZoomRef.current;
    if (!zoom) return;
    let rafId: number;
    const durationMs = 100;
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const tick = () => {
      const zoom = harvestTapZoomRef.current;
      if (!zoom) return;
      const elapsed = Date.now() - zoom.startTime;
      const t = Math.min(1, elapsed / durationMs);
      const alpha = easeOutCubic(t);
      const value = zoom.start + (zoom.end - zoom.start) * alpha;
      harvestProgressRef.current = value;
      if (t >= 1) {
        harvestProgressRef.current = zoom.end;
        harvestTapZoomRef.current = null;
        if (zoom.end >= 100) {
          setHarvestProgress(100);
          setIsHarvestFlashing(true);
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [harvestTapZoomTrigger]);

  // Harvest auto-progress: driven at 60fps via harvestProgressRef for smooth updates
  useEffect(() => {
    if (harvestSpeedLevel < 1) return;
    lastHarvestProgressTimeRef.current = Date.now();
    let rafId: number;
    const perMinute = harvestSpeedLevel; // 1/min per upgrade level
    const percentPerMs = (perMinute * 100) / (60 * 1000); // % progress per millisecond
    const tick = () => {
      if (harvestTapZoomRef.current) {
        lastHarvestProgressTimeRef.current = Date.now();
        rafId = requestAnimationFrame(tick);
        return;
      }
      const now = Date.now();
      let deltaMs = now - lastHarvestProgressTimeRef.current;
      lastHarvestProgressTimeRef.current = now;
      deltaMs = Math.min(deltaMs, 50); // cap for tab backgrounding
      const added = deltaMs * percentPerMs;
      const next = Math.min(100, harvestProgressRef.current + added);
      harvestProgressRef.current = next;
      if (next >= 100) {
        setHarvestProgress(100);
        setIsHarvestFlashing(true);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [harvestSpeedLevel]);

  const spawnCropAt = useCallback((index: number, plantLevel: number = 1) => {
    setGrid(prev => {
      const newGrid = [...prev];
      if (newGrid[index] && newGrid[index].item === null) {
        newGrid[index] = {
          ...newGrid[index],
          item: {
            id: Math.random().toString(36).substr(2, 9),
            level: plantLevel,
            type: 'CROP'
          }
        };
      }
      return newGrid;
    });
    setImpactCellIdx(index);
    setTimeout(() => setImpactCellIdx(null), 500);
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsExpanded(true);
  };

  /** Calculate the plant level to spawn based on seed quality */
  const calculatePlantLevel = useCallback((): number => {
    const baseTier = getSeedBaseTier(seedsState);
    const qualityPercent = getSeedQualityPercent(seedsState);
    
    // Roll for quality upgrade: qualityPercent% chance to spawn baseTier+1 instead of baseTier
    if (qualityPercent > 0 && Math.random() * 100 < qualityPercent) {
      return baseTier + 1;
    }
    return baseTier;
  }, [seedsState]);

  const handlePlantClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // When white (seeds in storage): only fire seed, no progress
    if (seedsInStorage > 0) {
      const emptyIndices = grid
        .map((cell, idx) => (cell.item === null ? idx : null))
        .filter((idx): idx is number => idx !== null);
      if (emptyIndices.length > 0) {
        const targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        // Calculate plant level at the moment of shooting (quality chance is determined on tap)
        const plantLevel = calculatePlantLevel();
        spawnProjectile(targetIdx, plantLevel);
        setSeedsInStorage((prev) => Math.max(0, prev - 1));
        
        // Bonus Seed: chance to fire a second seed
        const bonusChance = getBonusSeedChance(seedsState);
        if (bonusChance > 0 && Math.random() * 100 < bonusChance) {
          // Get remaining empty cells (excluding the first target)
          const remainingEmptyIndices = emptyIndices.filter(idx => idx !== targetIdx);
          
          // Pick a target for the second seed
          let secondTargetIdx: number;
          if (remainingEmptyIndices.length > 0) {
            // Fire to a different empty cell
            secondTargetIdx = remainingEmptyIndices[Math.floor(Math.random() * remainingEmptyIndices.length)];
          } else {
            // No other empty cell - fire to the same cell (seed will be "wasted")
            // We still spawn the projectile for visual effect, but spawnCropAt won't place anything
            // since the cell will already have an item
            secondTargetIdx = targetIdx;
          }
          
          const secondPlantLevel = calculatePlantLevel();
          // Slight delay so the two seeds don't overlap visually
          setTimeout(() => {
            spawnProjectile(secondTargetIdx, secondPlantLevel);
          }, 50);
        }
      }
      return;
    }

    if (isSeedFlashing) return;

    // Add +20% progress when button is green (no seeds in storage)
    const start = Math.max(0, seedProgressRef.current);
    const totalAfterTap = start + 20;
    
    if (totalAfterTap > 100) {
      // Tap goes past 100%: add to storage, reset to 0%, then continue with remainder
      const remainder = totalAfterTap - 100;
      setSeedsInStorage((prev) => Math.min(seedStorageMax, prev + 1));
      seedProgressRef.current = 0;
      setSeedProgress(0);
      setIsSeedFlashing(false);
      setSeedBounceTrigger((t) => t + 1);
      // Zoom from 0% to remainder (e.g. 5%)
      tapZoomRef.current = { start: 0, end: remainder, startTime: Date.now(), duration: 100 };
      setTapZoomTrigger((n) => n + 1);
    } else {
      // Normal tap: zoom from start to end (capped at 100%)
      const end = Math.min(100, totalAfterTap);
      tapZoomRef.current = { start, end, startTime: Date.now(), duration: 100 };
      setTapZoomTrigger((n) => n + 1);
    }

    setActiveTab('SEEDS');
  };

  const calculateFarmValue = useCallback(() => {
    return grid.reduce((acc, cell) => {
      if (!cell.item) return acc;
      return acc + Math.pow(3, cell.item.level - 1) * 25;
    }, 0);
  }, [grid]);

  const handleHarvestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHarvestFlashing) return;

    // Add +20 progress per tap (animated via harvestTapZoomRef)
    const current = harvestProgressRef.current;
    const next = Math.min(100, current + 20);
    harvestTapZoomRef.current = { start: current, end: next, startTime: Date.now(), duration: 100 };
    setHarvestTapZoomTrigger((t) => t + 1);

    setActiveTab('HARVEST');
  };

  /**
   * At 100% harvest progress: perform harvest (spawn coin panels, leaf bursts), flash white, reset to 0%.
   */
  useEffect(() => {
    if (harvestProgress !== 100 || !isHarvestFlashing) return;
    
    const farmValue = calculateFarmValue();
    const tapProfit = Math.max(1, Math.floor(farmValue * 0.05));
    setMoney(prev => prev + tapProfit);

    // Snapshot grid at exact 100%: only plants on the board now produce coins
    const container = containerRef.current;
    const wallet = walletRef.current;
    const walletIcon = walletIconRef.current;
    const walletEl = walletIcon || wallet;
    const harvestCellIndices: number[] = [];

    if (container && walletEl) {
      const containerRect = container.getBoundingClientRect();
      const walletRect = walletEl.getBoundingClientRect();
      const walletCenterX = walletRect.left + walletRect.width / 2 - containerRect.left;
      const walletCenterY = walletRect.top + walletRect.height / 2 - containerRect.top;

      const panelsWithDist: { panel: CoinPanelData; dist: number }[] = [];

      grid.forEach((cell, cellIdx) => {
        if (!cell.item) return;
        harvestCellIndices.push(cellIdx);
        const value = getCoinValueForLevel(cell.item.level);
        const hexEl = document.getElementById(`hex-${cellIdx}`);
        if (!hexEl) return;
        const hexRect = hexEl.getBoundingClientRect();
        const startX = hexRect.left + hexRect.width / 2 - containerRect.left;
        const startY = hexRect.top + hexRect.height / 2 - containerRect.top;
        const hoverX = startX;
        const hexTopY = hexRect.top - containerRect.top;
        const panelHeightPx = 14;
        const offsetUp = (panelHeightPx / 2 + 4) * 0.8;
        const hoverY = hexTopY - offsetUp;
        const dist = Math.hypot(hoverX - walletCenterX, hoverY - walletCenterY);
        panelsWithDist.push({
          dist,
          panel: {
            id: `coin-${cellIdx}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            value,
            startX,
            startY,
            hoverX,
            hoverY,
            moveToWalletDelayMs: 0,
          },
        });
      });

      setHarvestBounceCellIndices(harvestCellIndices);
      setTimeout(() => setHarvestBounceCellIndices([]), 250);

      harvestCellIndices.forEach((cellIdx) => {
        const hexEl = document.getElementById(`hex-${cellIdx}`);
        if (hexEl) {
          const r = hexEl.getBoundingClientRect();
          setLeafBurstsSmall((prev) => [
            ...prev,
            {
              id: `harvest-${cellIdx}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              x: r.left + r.width / 2,
              y: r.top + r.height / 2,
              startTime: Date.now(),
            },
          ]);
        }
      });

      if (panelsWithDist.length > 0) {
        const N = panelsWithDist.length;
        const minDist = Math.min(...panelsWithDist.map((x) => x.dist));
        const maxDist = Math.max(...panelsWithDist.map((x) => x.dist));
        const range = maxDist - minDist || 1;
        const maxStaggerMs = N <= 1 ? 0 : Math.min(300, 300 * (N - 1) / 4);
        const panels: CoinPanelData[] = panelsWithDist.map(({ panel, dist }) => ({
          ...panel,
          moveToWalletDelayMs: ((dist - minDist) / range) * maxStaggerMs,
        }));
        setActiveCoinPanels(prev => [...prev, ...panels]);
      }
    }

    // Reset to 0% and continue auto-progress
    harvestProgressRef.current = 0;
    setHarvestProgress(0);
    setTimeout(() => setIsHarvestFlashing(false), 300);
  }, [harvestProgress, isHarvestFlashing, calculateFarmValue, grid]);

  const handleMerge = (sourceIdx: number, targetIdx: number) => {
    setGrid(prev => {
      const newGrid = [...prev];
      const source = newGrid[sourceIdx];
      const target = newGrid[targetIdx];
      if (!source.item) return prev;
      if (target.item && target.item.level === source.item.level) {
        newGrid[targetIdx] = {
          ...target,
          item: { ...target.item, level: target.item.level + 1 }
        };
        newGrid[sourceIdx] = { ...source, item: null };
      } else if (!target.item) {
        newGrid[targetIdx] = { ...target, item: source.item };
        newGrid[sourceIdx] = { ...source, item: null };
      }
      return newGrid;
    });
  };

  const getScreenIndex = () => {
    switch (activeScreen) {
      case 'STORE': return 0;
      case 'FARM': return 1;
      case 'BARN': return 2;
      default: return 1;
    }
  };

  const screenTranslateX = `translateX(-${(getScreenIndex() * 100) / 3}%)`;

  return (
    <ErrorBoundary>
    <div className="flex items-center justify-center min-h-screen bg-[#050608] overflow-hidden">
      <div 
        ref={containerRef}
        id="game-container"
        className="relative w-full max-w-md aspect-[9/16] max-h-screen shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col select-none font-['Inter'] grass-texture"
      >
        {/* Grass Detail Overlay */}
        <div className="absolute inset-0 pointer-events-none grass-blades opacity-40"></div>

        <div className="flex-grow relative overflow-hidden h-full" style={{ zIndex: 10 }}>
          <div 
            className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: screenTranslateX, width: '300%' }}
          >
            <div className="w-1/3 h-full bg-[#0c0d12]/90 backdrop-blur-sm">
              <StoreScreen money={money} walletFlashActive={walletFlashActive} onAddMoney={(amt) => setMoney(prev => prev + amt)} />
            </div>

            <div ref={farmColumnRef} className="w-1/3 h-full flex flex-col relative overflow-hidden">
              {/* 1. Bleed: flat #3d8f38, full column, behind sprite (visible behind upgrade curve) */}
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{ background: '#3d8f38' }}
              />
              {/* 2. Background sprite: primary, on top of bleed; center pinned to hex grid; transition matches upgrade panel (500ms, cubic-bezier) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
                <img
                  src="/assets/background/background_grass.png"
                  alt=""
                  className="absolute flex-shrink-0 flex-grow-0"
                  style={{
                    left: `${spriteCenter.x}%`,
                    top: `${spriteCenter.y}%`,
                    width: 'auto',
                    height: 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    objectFit: 'none',
                    transform: 'translate(-50%, -50%) scale(0.65)',
                  }}
                />
              </div>

              {/* Farm Header - pinned to this screen */}
              <div className="relative z-50">
                <PageHeader 
                  money={money}
                  walletRef={walletRef}
                  walletIconRef={walletIconRef}
                  walletFlashActive={walletFlashActive}
                  onWalletClick={() => setActiveScreen('STORE')}
                />
              </div>

              <div 
                ref={hexAreaRef}
                className="relative flex-grow flex flex-col items-center justify-center overflow-hidden z-10"
              >
                {/* Only tapping this backdrop (background) closes the panel; hex cells and plants do not */}
                <div
                  className="absolute inset-0 z-0 cursor-pointer"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close upgrade panel"
                />
                <div className="absolute bottom-4 w-full px-3 flex justify-between items-end z-20 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                   <div className="pointer-events-auto flex items-center justify-center" ref={plantButtonRef} style={{ transform: 'scale(0.9)', transformOrigin: 'center center' }} onClick={(e) => e.stopPropagation()}>
                     <SideAction 
                        label="Plant" 
                        icon={`/assets/plants/plant_${seedBaseTier}.png`}
                        iconScale={1.25}
                        iconOffsetY={-3}
                        progress={Math.max(0, Math.min(1, seedProgress / 100))}
                        progressRef={seedProgressRef} 
                        color="#a7c957"
                        isActive={activeTab === 'SEEDS' && isExpanded}
                        isFlashing={seedsInStorage > 0}
                        shouldAnimate={!isGridFull}
                        isBoardFull={isGridFull}
                        storageCount={seedsInStorage}
                        storageMax={seedStorageMax}
                        bounceTrigger={seedBounceTrigger}
                        onClick={handlePlantClick}
                      />
                   </div>
                   <div className="pointer-events-auto flex items-center justify-center" style={{ transform: 'scale(0.9)', transformOrigin: 'center center' }} onClick={(e) => e.stopPropagation()}>
                     <SideAction 
                        label="Harvest" 
                        icon="🧺" 
                        progress={harvestProgress / 100}
                        progressRef={harvestProgressRef}
                        color="#a7c957"
                        isActive={activeTab === 'HARVEST' && isExpanded}
                        isFlashing={isHarvestFlashing}
                        shouldAnimate={true}
                        isBoardFull={false}
                        noRotateOnFlash={true}
                        onClick={handleHarvestClick}
                      />
                   </div>
                </div>

                {/* Reduced height from 340px to 323px (5% smaller); pointer-events-none so taps on background close upgrade panel */}
                <div className="relative w-full flex items-center justify-center h-[323px] overflow-visible mb-12 pointer-events-none">
                  <HexBoard 
                    isActive={activeTab === 'CROPS' && isExpanded} 
                    grid={grid}
                    onMerge={handleMerge}
                    impactCellIdx={impactCellIdx}
                    returnImpactCellIdx={returnImpactCellIdx}
                    onReturnImpact={(idx) => {
                      setReturnImpactCellIdx(idx);
                      if (idx != null) setTimeout(() => setReturnImpactCellIdx(null), 100);
                    }}
                    onLandOnNewCell={(targetIdx) => {
                      setNewCellImpactIdx(targetIdx);
                      setTimeout(() => setNewCellImpactIdx(null), 300);
                    }}
                    onReleaseFromCell={(cellIdx) => {
                      setSourceCellFadeOutIdx(cellIdx);
                      setTimeout(() => setSourceCellFadeOutIdx(null), 150);
                    }}
                    sourceCellFadeOutIdx={sourceCellFadeOutIdx}
                    newCellImpactIdx={newCellImpactIdx}
                    containerRef={containerRef}
                    dragState={dragState}
                    setDragState={setDragState}
                    harvestBounceCellIndices={harvestBounceCellIndices}
                    onMergeImpactStart={(cellIdx, px, py, mergeResultLevel) => {
                      const container = containerRef.current;
                      if (!container) return;
                      const rect = container.getBoundingClientRect();
                      setLeafBursts((prev) => [
                        ...prev,
                        {
                          id: Math.random().toString(36).slice(2),
                          x: rect.left + px,
                          y: rect.top + py,
                          startTime: Date.now(),
                        },
                      ]);
                      if (mergeResultLevel != null) {
                        const value = getCoinValueForLevel(mergeResultLevel);
                        const hexEl = document.getElementById(`hex-${cellIdx}`);
                        const panelHeightPx = 14;
                        const offsetUp = (panelHeightPx / 2 + 4) * 0.4;
                        const hoverX = px;
                        const hoverY = hexEl
                          ? (hexEl.getBoundingClientRect().top - rect.top) - offsetUp
                          : py - offsetUp;
                        setActiveCoinPanels((prev) => [
                          ...prev,
                          {
                            id: `merge-${cellIdx}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            value,
                            startX: px,
                            startY: py,
                            hoverX,
                            hoverY,
                            moveToWalletDelayMs: 0,
                          },
                        ]);
                      }
                    }}
                  />
                </div>
              </div>

              <div 
                onClick={(e) => e.stopPropagation()}
                className={`flex flex-col overflow-hidden relative z-30 shadow-[0_-15px_50px_rgba(0,0,0,0.15)] rounded-t-[32px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isExpanded ? 'h-[42%]' : 'h-[40px]'
                }`}
                style={{
                  background: '#fcf0c6',
                  borderTop: '1px solid #ebdbaf'
                }}
              >
                <UpgradeTabs activeTab={activeTab} onTabChange={handleTabChange} />
                <div className="flex-grow overflow-hidden relative">
                  <UpgradeList 
                    activeTab={activeTab} 
                    onTabChange={handleTabChange} 
                    money={money} 
                    setMoney={setMoney}
                    seedsState={seedsState}
                    setSeedsState={setSeedsState}
                    harvestState={harvestState}
                    setHarvestState={setHarvestState}
                  />
                </div>
              </div>
            </div>

            <div className="w-1/3 h-full bg-[#0a0b0f]/90 backdrop-blur-sm flex flex-col">
              <PageHeader money={money} walletFlashActive={walletFlashActive} />
              <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white/20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.097 0 2.16.195 3.14.552c.98-.357 2.043-.552 3.14-.552c1.097 0 2.16.195 3.14-.552c.98-.357 2.043-.552 3.14-.552c1.097 0 2.16.195 3.14-.552c.98-.357 2.043-.552 3.14-.552c.917 0 1.8.155 2.625.441v-14.25a9.047 9.047 0 00-3-.512a8.947 8.947 0 00-6 2.292z" />
                  </svg>
                </div>
                <div className="text-white/20 font-black tracking-widest uppercase text-xs">Barn Inventory Soon</div>
              </div>
            </div>
          </div>
        </div>

        <Navbar activeScreen={activeScreen} onScreenChange={setActiveScreen} />

        {/* Leaf burst: portal to body so never clipped; viewport coords */}
        {createPortal(
          <div className="fixed inset-0 pointer-events-none overflow-visible" style={{ zIndex: 55 }}>
            {leafBursts.map((b) => (
              <LeafBurst
                key={b.id}
                x={b.x}
                y={b.y}
                startTime={b.startTime}
                onComplete={() => setLeafBursts((prev) => prev.filter((x) => x.id !== b.id))}
              />
            ))}
            {leafBurstsSmall.map((b) => (
              <LeafBurst
                key={b.id}
                x={b.x}
                y={b.y}
                startTime={b.startTime}
                particleCount={LEAF_BURST_SMALL_COUNT}
                onComplete={() => setLeafBurstsSmall((prev) => prev.filter((x) => x.id !== b.id))}
              />
            ))}
          </div>,
          document.body
        )}

        <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
          {activeProjectiles.map(p => (
            <Projectile 
              key={p.id}
              data={p}
              onImpact={(targetIdx) => {
                // Use the plantLevel that was determined when the seed was shot
                spawnCropAt(targetIdx, p.plantLevel);
                const hexEl = document.getElementById(`hex-${targetIdx}`);
                if (hexEl) {
                  const r = hexEl.getBoundingClientRect();
                  setLeafBurstsSmall((prev) => [
                    ...prev,
                    {
                      id: Math.random().toString(36).slice(2),
                      x: r.left + r.width / 2,
                      y: r.top + r.height / 2,
                      startTime: Date.now(),
                    },
                  ]);
                }
              }}
              onComplete={() => {
                setActiveProjectiles(prev => prev.filter(item => item.id !== p.id));
              }}
            />
          ))}
          {activeCoinPanels.map((coin) => (
            <CoinPanel
              key={coin.id}
              data={coin}
              containerRef={containerRef}
              walletRef={walletRef}
              walletIconRef={walletIconRef}
              onImpact={(value) => {
                setMoney(prev => prev + value);
                setWalletFlashActive(true);
                setWalletBursts((prev) => [...prev, { id: nextWalletBurstIdRef.current++, trigger: Date.now() }]);
                if (walletFlashTimeoutRef.current) clearTimeout(walletFlashTimeoutRef.current);
                walletFlashTimeoutRef.current = setTimeout(() => setWalletFlashActive(false), 75);
              }}
              onComplete={() => setActiveCoinPanels(prev => prev.filter((c) => c.id !== coin.id))}
            />
          ))}
          {walletBursts.map((burst) => (
            <WalletImpactBurst
              key={burst.id}
              trigger={burst.trigger}
              walletIconRef={walletIconRef}
              containerRef={containerRef}
              onComplete={() => setWalletBursts((prev) => prev.filter((b) => b.id !== burst.id))}
            />
          ))}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
