
import React from 'react';
import { PageHeader } from './PageHeader';

interface StoreScreenProps {
  money: number;
  walletFlashActive?: boolean;
  onAddMoney?: (amount: number) => void;
}

const BUILD_VERSION = '1.1.6';

export const StoreScreen: React.FC<StoreScreenProps> = ({ money, walletFlashActive }) => {
  return (
    <div className="h-full w-full flex flex-col overflow-y-auto no-scrollbar">
      <PageHeader money={money} walletFlashActive={walletFlashActive} />
      
      {/* Build version indicator */}
      <div className="text-center text-white/40 text-[10px] font-mono mt-1">{BUILD_VERSION}</div>
      
      <div className="flex-grow flex flex-col items-center justify-center px-6">
        <div className="w-full text-center mt-4">
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Store</h2>
          <div className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase">Marketplace & Deals</div>
        </div>

        <div className="w-full flex flex-col items-center justify-center flex-grow">
          <div className="bg-[#16181f]/50 border border-white/5 rounded-[24px] p-8 flex flex-col items-center justify-center space-y-2">
            <div className="text-white/20 text-[10px] font-black uppercase tracking-widest">Coming Soon</div>
            <div className="w-full max-w-[200px] h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-white/10"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
