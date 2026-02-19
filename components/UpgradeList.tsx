
import React, { useState, useRef, useEffect } from 'react';
import { TabType } from '../types';

interface UpgradeState {
  level: number;
  progress: number;
}

interface UpgradeListProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  money: number;
  setMoney: React.Dispatch<React.SetStateAction<number>>;
}

const INITIAL_UPGRADES = [
  { id: 'opt1', name: 'SOIL QUALITY', cost: '150', icon: '🟤' },
  { id: 'opt2', name: 'FERTILIZER', cost: '500', icon: '🧪' },
  { id: 'opt3', name: 'SUN INTENSITY', cost: '2.5K', icon: '☀️' },
  { id: 'opt4', name: 'IRRIGATION', cost: '10K', icon: '💧' },
  { id: 'opt5', name: 'CROP ROTATION', cost: '50K', icon: '♻️' },
  { id: 'opt6', name: 'AUTO-SOWER', cost: '250K', icon: '🚜' },
  { id: 'opt7', name: 'YIELD BONUS', cost: '1.2M', icon: '🌾' },
  { id: 'opt8', name: 'GOLDEN SPROUT', cost: '50M', icon: '🌟' },
];

const TABS: TabType[] = ['SEEDS', 'CROPS', 'HARVEST'];

const parseCost = (cost: string): number => {
  const num = parseFloat(cost.replace(/[^0-9.]/g, ''));
  if (cost.includes('K')) return num * 1000;
  if (cost.includes('M')) return num * 1000000;
  return num;
};

export const UpgradeList: React.FC<UpgradeListProps> = ({ activeTab, onTabChange, money, setMoney }) => {
  const createInitialState = () => INITIAL_UPGRADES.reduce((acc, curr) => ({ ...acc, [curr.id]: { level: 1, progress: 0 } }), {});
  const [seedsState, setSeedsState] = useState<Record<string, UpgradeState>>(createInitialState());
  const [cropsState, setCropsState] = useState<Record<string, UpgradeState>>(createInitialState());
  const [harvestState, setHarvestState] = useState<Record<string, UpgradeState>>(createInitialState());
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const [pressedId, setPressedId] = useState<string | null>(null);

  const scrollRefs = {
    SEEDS: useRef<HTMLDivElement>(null),
    CROPS: useRef<HTMLDivElement>(null),
    HARVEST: useRef<HTMLDivElement>(null),
  };

  const [dragOffset, setDragOffset] = useState(0);
  const [isHorizontalDragging, setIsHorizontalDragging] = useState(false);

  useEffect(() => {
    const el = (scrollRefs as any)[activeTab].current;
    if (el) el.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    TABS.forEach((cat) => {
      const el = (scrollRefs as any)[cat].current;
      if (!el) return;
      let isDown = false;
      let directionLocked: 'none' | 'vertical' | 'horizontal' = 'none';
      let startX: number;
      let startY: number;
      let scrollTop: number;
      let velocityV = 0;
      let lastY = 0;
      let lastTime = 0;
      let rafId: number;

      const momentumLoop = () => {
        if (!isDown && Math.abs(velocityV) > 0.1) {
          const maxScroll = el.scrollHeight - el.clientHeight;
          const nextScroll = el.scrollTop - velocityV;
          el.scrollTop = Math.max(0, Math.min(nextScroll, maxScroll));
          velocityV *= 0.94; 
          rafId = requestAnimationFrame(momentumLoop);
        }
      };

      const handleMouseDown = (e: MouseEvent) => {
        isDown = true;
        directionLocked = 'none';
        velocityV = 0;
        cancelAnimationFrame(rafId);
        startX = e.pageX;
        startY = e.pageY;
        scrollTop = el.scrollTop;
        lastY = e.pageY;
        lastTime = Date.now();
        window.addEventListener('mousemove', handleMouseMoveGlobal);
        window.addEventListener('mouseup', handleMouseUpGlobal);
      };

      const handleMouseMoveGlobal = (e: MouseEvent) => {
        if (!isDown) return;
        const dx = e.pageX - startX;
        const dy = e.pageY - startY;
        if (directionLocked === 'none') {
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            directionLocked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
            if (directionLocked === 'horizontal') setIsHorizontalDragging(true);
          }
          return;
        }
        if (directionLocked === 'horizontal') setDragOffset(dx);
        else if (directionLocked === 'vertical') {
          const now = Date.now();
          if (now - lastTime > 0) velocityV = velocityV * 0.2 + (e.pageY - lastY) * 0.8;
          el.scrollTop = Math.max(0, Math.min(scrollTop - dy, el.scrollHeight - el.clientHeight));
          lastY = e.pageY;
          lastTime = now;
        }
      };

      const handleMouseUpGlobal = (e: MouseEvent) => {
        if (!isDown) return;
        isDown = false;
        const finalDx = e.pageX - startX;
        window.removeEventListener('mousemove', handleMouseMoveGlobal);
        window.removeEventListener('mouseup', handleMouseUpGlobal);
        if (directionLocked === 'horizontal') {
          setIsHorizontalDragging(false);
          setDragOffset(0);
          const currentIndex = TABS.indexOf(activeTab);
          if (finalDx > 100 && currentIndex > 0) onTabChange(TABS[currentIndex - 1]);
          else if (finalDx < -100 && currentIndex < TABS.length - 1) onTabChange(TABS[currentIndex + 1]);
        } else if (directionLocked === 'vertical' && Math.abs(velocityV) > 1) {
          rafId = requestAnimationFrame(momentumLoop);
        }
      };

      el.addEventListener('mousedown', handleMouseDown);
      cleanups.push(() => {
        el.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMoveGlobal);
        window.removeEventListener('mouseup', handleMouseUpGlobal);
        cancelAnimationFrame(rafId);
      });
    });
    return () => cleanups.forEach(c => c());
  }, [activeTab, onTabChange]);

  const handleUpgrade = (id: string, category: TabType, costStr: string) => {
    const cost = parseCost(costStr);
    if (money < cost) return;
    setMoney(prev => prev - cost);

    const setter = category === 'SEEDS' ? setSeedsState : category === 'CROPS' ? setCropsState : setHarvestState;
    setter((prev: any) => {
      const current = prev[id];
      const nextProgress = current.progress + 1;
      
      if (nextProgress >= 10) {
        setFlashingIds(prevSet => new Set(prevSet).add(id));
        setTimeout(() => {
          setFlashingIds(prevSet => {
            const nextSet = new Set(prevSet);
            nextSet.delete(id);
            return nextSet;
          });
        }, 350); 
        
        return { ...prev, [id]: { level: current.level + 1, progress: 0 } };
      }
      return { ...prev, [id]: { ...current, progress: nextProgress } };
    });
  };

  const renderUpgradeItems = (category: TabType, stateMap: Record<string, UpgradeState>) => (
    <div ref={(scrollRefs as any)[category]} className="flex-grow overflow-y-auto no-scrollbar px-3 pt-3 pb-28 h-full space-y-2.5 overscroll-contain cursor-grab active:cursor-grabbing select-none">
      {INITIAL_UPGRADES.map((upgrade) => {
        const state = stateMap[upgrade.id];
        const canAfford = money >= parseCost(upgrade.cost);
        const isFlashing = flashingIds.has(upgrade.id);
        const isPressed = pressedId === upgrade.id;
        
        const descTextColor = '#c2b180';
        const buttonColor = '#cae060';
        const buttonActiveColor = '#61882b';
        const buttonDisabledColor = '#e3c28c';
        
        const buttonDepthColor = '#9db546';
        const buttonActiveDepthColor = '#61882b';
        const buttonDisabledDepthColor = '#c7a36e';
        
        const buttonFontColor = '#587e26';
        const buttonActiveFontColor = '#cbe05d';
        const buttonDisabledFontColor = '#a68e64';

        const displayProgress = isFlashing ? 10 : state.progress;
        const progressPercent = displayProgress * 10;

        return (
          <div 
            key={upgrade.id} 
            className={`relative flex flex-col transition-all duration-300 border-2 ${
              isFlashing 
                ? 'bg-[#a7c957] scale-[1.01] shadow-lg z-10 border-[#c2b180] rounded-[11px]' 
                : 'bg-[#fcf0c6] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border-[#ebdbaf] rounded-[11px]'
            }`}
          >
            <div className="flex items-center p-1.5 px-3">
              {/* Square Icon Box */}
              <div className="w-[38px] h-[38px] shrink-0 flex items-center justify-center bg-[#583c1f] rounded-[8px] shadow-sm">
                <span className="text-[22px] leading-none select-none">{upgrade.icon}</span>
              </div>
              
              {/* Text Content */}
              <div className="flex-grow px-3">
                <div className="flex items-baseline space-x-1.5">
                  {/* Updated title font size to 13px (from 14px) as requested */}
                  <h3 className={`text-[13px] font-black tracking-tight uppercase leading-none ${isFlashing ? 'text-[#386641]' : 'text-[#583c1f]'}`}>
                    {upgrade.name}
                  </h3>
                  {/* Level indicator size */}
                  <span className={`text-[9px] font-black uppercase ${isFlashing ? 'text-[#386641]/60' : 'text-[#a6a38a]'}`}>
                    LV {state.level}
                  </span>
                </div>
                {/* Description size */}
                <div className={`text-[10px] font-black uppercase mt-0.5 tracking-tight ${isFlashing ? 'text-[#386641]/50' : ''}`} style={{ color: isFlashing ? undefined : descTextColor }}>
                  YIELD: +{(state.level * 30).toFixed(0)}%
                </div>
              </div>

              {/* Price Button */}
              <button 
                onMouseDown={() => canAfford && setPressedId(upgrade.id)}
                onMouseUp={() => setPressedId(null)}
                onMouseLeave={() => setPressedId(null)}
                onClick={() => handleUpgrade(upgrade.id, category, upgrade.cost)} 
                className={`relative flex items-center justify-center min-w-[70px] h-8 transition-all border outline outline-1 ${
                  canAfford 
                    ? 'active:translate-y-[2px] active:border-b-0 active:mb-[4px]' 
                    : ''
                } rounded-[8px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]`}
                style={{
                  backgroundColor: isPressed ? buttonActiveColor : (canAfford ? buttonColor : buttonDisabledColor),
                  borderColor: isPressed ? buttonActiveDepthColor : (canAfford ? buttonDepthColor : buttonDisabledDepthColor),
                  borderBottomWidth: isPressed ? '0px' : '4px',
                  marginBottom: isPressed ? '4px' : '0px',
                  outlineColor: isPressed ? buttonActiveDepthColor : (canAfford ? buttonDepthColor : buttonDisabledDepthColor),
                }}
              >
                <span 
                  className="text-[13px] font-black tracking-tighter transition-colors"
                  style={{ 
                    color: isPressed ? buttonActiveFontColor : (canAfford ? buttonFontColor : buttonDisabledFontColor)
                  }}
                >
                  {upgrade.cost}
                </span>
              </button>
            </div>

            {/* Thicker Progress Bar - Increased to 6px height (20% more than 5px) */}
            <div className="flex w-full h-[10px] px-3 pb-2">
              <div className="w-full h-[6px] bg-[#9d8a57]/20 rounded-full overflow-hidden relative" style={{ minHeight: '6px' }}>
                <div 
                  className={`absolute left-0 top-0 h-full ${
                    isFlashing ? 'bg-[#386641]' : 'bg-[#a7c957]'
                  }`}
                  style={{ 
                    width: `${progressPercent}%`,
                    transition: (progressPercent === 0 && !isFlashing) 
                      ? 'none' 
                      : 'width 0.25s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const getTabIndex = () => TABS.indexOf(activeTab);
  const translateX = `calc(-${getTabIndex() * (100 / 3)}% + ${dragOffset}px)`;
  return (
    <div className="h-full relative overflow-hidden">
      <div className={`tab-content-container h-full ${isHorizontalDragging ? 'transition-none' : 'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'}`} style={{ transform: `translateX(${translateX})` }}>
        <div className="tab-pane h-full">{renderUpgradeItems('SEEDS', seedsState)}</div>
        <div className="tab-pane h-full">{renderUpgradeItems('CROPS', cropsState)}</div>
        <div className="tab-pane h-full">{renderUpgradeItems('HARVEST', harvestState)}</div>
      </div>
    </div>
  );
};
