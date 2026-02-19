
import React from 'react';
import { TabType } from '../types';

interface UpgradeTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TAB_ICONS: Record<TabType, string> = {
  SEEDS: '🌱',
  CROPS: '🌻',
  HARVEST: '🚜',
};

export const UpgradeTabs: React.FC<UpgradeTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: TabType[] = ['SEEDS', 'CROPS', 'HARVEST'];
  return (
    <div className="flex w-full bg-[#fcf0c6] relative h-[38px] shrink-0 items-center px-4">
      {/* Background Underline - Spans full width, matches thickness of the active indicator */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/5 pointer-events-none"></div>

      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 flex flex-row items-center justify-center space-x-1.5 transition-all duration-300 active:scale-95 h-full relative z-10`}
          >
            <span className={`text-[9px] filter saturate-[0.8] ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
              {TAB_ICONS[tab]}
            </span>
            <span className={`text-[10px] font-black tracking-[0.1em] transition-colors duration-300 ${
              isActive ? 'text-[#6a994e]' : 'text-[#c2b280]'
            }`}>
              {tab}
            </span>
          </button>
        );
      })}
      
      {/* Active Tab Indicator - Matches the image's green underline + triangle tip */}
      <div 
        className="absolute bottom-0 h-[2px] bg-[#a7c957] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-full z-20"
        style={{
          width: '28%',
          left: activeTab === 'SEEDS' ? '4%' : activeTab === 'CROPS' ? '36%' : '68%'
        }}
      >
        <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#a7c957] rounded-[1px]"></div>
      </div>
    </div>
  );
};
