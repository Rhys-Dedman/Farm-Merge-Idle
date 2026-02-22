
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { HexBoard } from './components/HexBoard';
import { UpgradeTabs } from './components/UpgradeTabs';
import { UpgradeList } from './components/UpgradeList';
import { Navbar } from './components/Navbar';
import { StoreScreen } from './components/StoreScreen';
import { SideAction } from './components/SideAction';
import { Projectile } from './components/Projectile';
import { TabType, ScreenType, BoardCell, Item } from './types';

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
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('SEEDS');
  const [activeScreen, setActiveScreen] = useState<ScreenType>('FARM');
  const [isExpanded, setIsExpanded] = useState(true);
  const [money, setMoney] = useState(1000);

  const [grid, setGrid] = useState<BoardCell[]>(generateInitialGrid());
  const [seedProgress, setSeedProgress] = useState(0);
  const [harvestProgress, setHarvestProgress] = useState(0);
  const [isSeedFlashing, setIsSeedFlashing] = useState(false);
  const [isHarvestFlashing, setIsHarvestFlashing] = useState(false);
  
  const [activeProjectiles, setActiveProjectiles] = useState<ProjectileData[]>([]);
  const [impactCellIdx, setImpactCellIdx] = useState<number | null>(null);
  
  const plantButtonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const farmColumnRef = useRef<HTMLDivElement>(null);
  const hexAreaRef = useRef<HTMLDivElement>(null);

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

  const spawnProjectile = useCallback((targetIdx: number) => {
    if (plantButtonRef.current && containerRef.current) {
      const btnRect = plantButtonRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const startX = (btnRect.left + btnRect.width / 2) - containerRect.left;
      const startY = (btnRect.top + btnRect.height / 2) - containerRect.top;
      
      const newProj: ProjectileData = {
        id: Math.random().toString(36).substr(2, 9),
        startX,
        startY,
        targetIdx
      };
      setActiveProjectiles(prev => [...prev, newProj]);
    }
  }, []);

  /**
   * CENTRALIZED FIRING LOGIC
   * Monitors progress and grid state. If we reach 100% and there's space,
   * fire exactly one projectile and reset progress.
   */
  useEffect(() => {
    if (seedProgress === 100 && isSeedFlashing && !isGridFull) {
      const emptyIndices = grid
        .map((cell, idx) => (cell.item === null ? idx : null))
        .filter((idx): idx is number => idx !== null);

      if (emptyIndices.length > 0) {
        const targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        
        // Fire projectile
        spawnProjectile(targetIdx);
        
        // RESET PROGRESS IMMEDIATELY to break this useEffect condition and prevent double-firing
        setSeedProgress(0);
        
        // Keep the "flashing" visual state active for a short duration
        setTimeout(() => {
          setIsSeedFlashing(false);
        }, 300);
      }
    }
  }, [grid, isGridFull, seedProgress, isSeedFlashing, spawnProjectile]);

  const spawnCropAt = useCallback((index: number) => {
    setGrid(prev => {
      const newGrid = [...prev];
      if (newGrid[index] && newGrid[index].item === null) {
        newGrid[index] = {
          ...newGrid[index],
          item: {
            id: Math.random().toString(36).substr(2, 9),
            level: 1,
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

  const handlePlantClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // BLOCKING: If we are already flashing/firing, don't allow another click
    if (isSeedFlashing) return;

    const nextProgress = seedProgress + 20;
    if (nextProgress >= 100) {
      setSeedProgress(100);
      setIsSeedFlashing(true);
      
      // Fire projectile immediately when reaching 100%
      if (!isGridFull) {
        const emptyIndices = grid
          .map((cell, idx) => (cell.item === null ? idx : null))
          .filter((idx): idx is number => idx !== null);

        if (emptyIndices.length > 0) {
          const targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          spawnProjectile(targetIdx);
          setSeedProgress(0);
          setTimeout(() => {
            setIsSeedFlashing(false);
          }, 300);
        }
      }
    } else {
      setSeedProgress(nextProgress);
    }

    if (activeTab !== 'SEEDS') {
      setActiveTab('SEEDS');
      setIsExpanded(true);
    }
  };

  const calculateFarmValue = useCallback(() => {
    return grid.reduce((acc, cell) => {
      if (!cell.item) return acc;
      return acc + Math.pow(3, cell.item.level - 1) * 25;
    }, 0);
  }, [grid]);

  const handleHarvestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (harvestProgress >= 100 || isHarvestFlashing) return;

    const farmValue = calculateFarmValue();
    const tapProfit = Math.max(1, Math.floor(farmValue * 0.05));
    setMoney(prev => prev + tapProfit);

    const nextProgress = harvestProgress + 10;
    if (nextProgress >= 100) {
      setHarvestProgress(100);
      setIsHarvestFlashing(true);
      
      const bonus = farmValue * 2;
      setMoney(prev => prev + bonus);

      setTimeout(() => {
        setIsHarvestFlashing(false);
        setHarvestProgress(0);
      }, 300);
    } else {
      setHarvestProgress(nextProgress);
    }

    if (activeTab !== 'HARVEST') {
      setActiveTab('HARVEST');
      setIsExpanded(true);
    }
  };

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
    <div className="flex items-center justify-center min-h-screen bg-[#050608] overflow-hidden">
      <div 
        ref={containerRef}
        id="game-container"
        className="relative w-full max-w-md aspect-[9/16] max-h-screen shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col select-none font-['Inter'] grass-texture"
      >
        {/* Grass Detail Overlay */}
        <div className="absolute inset-0 pointer-events-none grass-blades opacity-40"></div>

        <div className="absolute top-0 left-0 w-full z-50">
          <Header money={money} onStoreClick={() => setActiveScreen('STORE')} />
        </div>

        <div className="flex-grow relative overflow-hidden h-full">
          <div 
            className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: screenTranslateX, width: '300%' }}
          >
            <div className="w-1/3 h-full bg-[#0c0d12]/90 backdrop-blur-sm">
              <StoreScreen onAddMoney={(amt) => setMoney(prev => prev + amt)} />
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

              <div 
                ref={hexAreaRef}
                onClick={() => setIsExpanded(false)}
                className="relative flex-grow flex flex-col items-center justify-center overflow-hidden cursor-pointer pt-20 z-10"
              >
                <div className="absolute bottom-4 w-full px-3 flex justify-between items-end z-20 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                   <div className="pointer-events-auto flex items-center justify-center" ref={plantButtonRef} style={{ transform: 'scale(0.9)', transformOrigin: 'center center' }}>
                     <SideAction 
                        label="Plant" 
                        icon="/assets/plants/plant_1.png" 
                        iconScale={1.25}
                        iconOffsetY={-3}
                        progress={seedProgress / 100} 
                        color="#a7c957"
                        isActive={activeTab === 'SEEDS' && isExpanded}
                        isFlashing={isSeedFlashing}
                        shouldAnimate={!isGridFull} // Only animate bounce/rotate when board has space
                        isBoardFull={isGridFull}
                        onClick={handlePlantClick}
                      />
                   </div>
                   <div className="pointer-events-auto flex items-center justify-center" style={{ transform: 'scale(0.9)', transformOrigin: 'center center' }}>
                     <SideAction 
                        label="Harvest" 
                        icon="🚜" 
                        progress={harvestProgress / 100} 
                        color="#a7c957"
                        isActive={activeTab === 'HARVEST' && isExpanded}
                        isFlashing={isHarvestFlashing}
                        shouldAnimate={true}
                        isBoardFull={false}
                        onClick={handleHarvestClick}
                      />
                   </div>
                </div>

                {/* Reduced height from 340px to 323px (5% smaller) */}
                <div className="relative w-full flex items-center justify-center h-[323px] overflow-visible mb-12">
                  <HexBoard 
                    isActive={activeTab === 'CROPS' && isExpanded} 
                    grid={grid}
                    onMerge={handleMerge}
                    impactCellIdx={impactCellIdx}
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
                  />
                </div>
              </div>
            </div>

            <div className="w-1/3 h-full bg-[#0a0b0f]/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 pt-20">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white/20">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.097 0 2.16.195 3.14.552c.98-.357 2.043-.552 3.14-.552c1.097 0 2.16.195 3.14-.552c.98-.357 2.043-.552 3.14-.552c1.097 0 2.16.195 3.14-.552c.98-.357 2.043-.552 3.14-.552c.917 0 1.8.155 2.625.441v-14.25a9.047 9.047 0 00-3-.512a8.947 8.947 0 00-6 2.292z" />
                 </svg>
               </div>
               <div className="text-white/20 font-black tracking-widest uppercase text-xs">Barn Inventory Soon</div>
            </div>
          </div>
        </div>

        <Navbar activeScreen={activeScreen} onScreenChange={setActiveScreen} />
        
        <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
          {activeProjectiles.map(p => (
            <Projectile 
              key={p.id}
              data={p}
              onImpact={() => {
                spawnCropAt(p.targetIdx);
              }}
              onComplete={() => {
                setActiveProjectiles(prev => prev.filter(item => item.id !== p.id));
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
