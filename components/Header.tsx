
import React from 'react';
import { assetPath } from '../utils/assetPath';

interface HeaderProps {
  money: number;
  onStoreClick?: () => void;
  walletRef?: React.RefObject<HTMLButtonElement | null>;
  walletIconRef?: React.RefObject<HTMLElement | null>;
  walletFlashActive?: boolean;
  hideWallet?: boolean;
}

const formatMoney = (amount: number): string => {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
  return amount.toString();
};

export const Header: React.FC<HeaderProps> = ({ money, onStoreClick, walletRef, walletIconRef, walletFlashActive, hideWallet }) => {
  return (
    <header className="flex justify-between items-center px-3 py-2 pt-4 z-10 shrink-0">
      <div className="flex space-x-2">
        {/* Wallet pill - flash overlay on coin impact */}
        <button
          ref={walletRef}
          onClick={onStoreClick}
          className="relative flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border-0 outline-none shadow-2xl hover:bg-black/60 active:scale-95 transition-all overflow-hidden"
          style={{ opacity: hideWallet ? 0 : 1, pointerEvents: hideWallet ? 'none' : 'auto' }}
        >
          {/* Flash overlay: no outline; text inverts when flash so it stays visible */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-75 ease-out border-0 outline-none"
            style={{
              background: '#fcf0c6',
              opacity: walletFlashActive ? 0.95 : 0,
            }}
            aria-hidden
          />
          <span
            ref={walletIconRef}
            className="relative flex items-center justify-center leading-none"
            aria-hidden
          >
            <img src={assetPath('/assets/icons/icon_coin.png')} alt="" className="w-[18px] h-[18px] object-contain" />
          </span>
          <span
            className={`relative font-black text-xs tracking-tight transition-colors duration-75 ${walletFlashActive ? 'text-[#583c1f]' : 'text-white'}`}
          >
            {formatMoney(money)}
          </span>
        </button>
      </div>

      <button className="w-9 h-9 flex items-center justify-center bg-black/50 backdrop-blur-md hover:bg-black/60 rounded-full transition-all border border-white/5 shadow-2xl" style={{ borderRadius: '9999px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/80">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>
  );
};
