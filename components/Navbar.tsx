import React, { forwardRef } from 'react';
import { ScreenType } from '../types';

interface NavbarProps {
  activeScreen: ScreenType;
  onScreenChange: (screen: ScreenType) => void;
  barnButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export const Navbar: React.FC<NavbarProps> = ({ activeScreen, onScreenChange, barnButtonRef }) => {
  const items: { id: ScreenType; label: string; path: string }[] = [
    { id: 'STORE', label: 'STORE', path: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-15 0V10.33a1.5 1.5 0 01.44-1.06L7.5 4.71a1.5 1.5 0 012.12 0L14.12 9.27a1.5 1.5 0 01.44 1.06V21M3.75 21h16.5" },
    { id: 'FARM', label: 'FARM', path: "M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-4.5L11.25 9M2.25 9v12M6.75 21V13.5" },
    { id: 'BARN', label: 'BARN', path: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.097 0 2.16.195 3.14.552c.98-.357 2.043-.552 3.14-.552c1.097 0 2.16.195 3.14.552c.98-.357 2.043-.552 3.14-.552c1.097 0 2.16.195 3.14-.552c.917 0 1.8.155 2.625.441v-14.25a9.047 9.047 0 00-3-.512a8.947 8.947 0 00-6 2.292z" },
  ];
  return (
    <nav className="h-16 bg-[#0c0d12] border-t border-white/5 flex items-center justify-around px-8 z-50 shrink-0">
      {items.map((item) => {
        const isActive = activeScreen === item.id;
        return (
          <button 
            key={item.id} 
            ref={item.id === 'BARN' ? barnButtonRef : undefined}
            onClick={() => onScreenChange(item.id)} 
            className={`flex flex-col items-center justify-center space-y-0.5 w-20 transition-all ${isActive ? 'opacity-100' : 'opacity-25'}`}
          >
            <div className={`p-1.5 rounded-xl transition-colors duration-300 ${isActive ? 'bg-[#1a1c25] text-[#a7c957]' : 'text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d={item.path} /></svg>
            </div>
            <span className="text-[9px] font-black tracking-widest text-white uppercase">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
