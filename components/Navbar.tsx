import React from 'react';
import { ScreenType } from '../types';

interface NavbarProps {
  activeScreen: ScreenType;
  onScreenChange: (screen: ScreenType) => void;
  barnButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export const Navbar: React.FC<NavbarProps> = ({ activeScreen, onScreenChange, barnButtonRef }) => {
  const items: { id: ScreenType; label: string; icon: string }[] = [
    { id: 'STORE', label: 'MARKET', icon: '/assets/icons/icon_market.png' },
    { id: 'FARM', label: 'FARM', icon: '/assets/icons/icon_farm.png' },
    { id: 'BARN', label: 'BARN', icon: '/assets/icons/icon_barn.png' },
  ];

  return (
    <nav 
      className="relative h-[61px] flex items-start justify-center z-50 shrink-0 overflow-visible"
      style={{ backgroundColor: '#282020' }}
    >
      {/* Top stroke layers */}
      <div 
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: '-4px',
          height: '2px',
          backgroundColor: '#171515',
        }}
      />
      <div 
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: '-2px',
          height: '2px',
          backgroundColor: '#443936',
        }}
      />
      
      {items.map((item) => {
        const isActive = activeScreen === item.id;
        return (
          <div 
            key={item.id}
            className="relative flex items-start justify-center"
            style={{ width: '135px', height: '100%' }}
          >
            {/* Shadow on left side of tab */}
            <div
              className="absolute pointer-events-none transition-opacity duration-200 ease-out"
              style={{
                top: '0px',
                right: '50%',
                marginRight: '67.5px',
                width: '40px',
                height: '100%',
                background: 'linear-gradient(to left, rgba(0,0,0,0.2) 0%, transparent 100%)',
                opacity: isActive ? 1 : 0,
              }}
            />
            {/* Shadow on right side of tab */}
            <div
              className="absolute pointer-events-none transition-opacity duration-200 ease-out"
              style={{
                top: '0px',
                left: '50%',
                marginLeft: '67.5px',
                width: '40px',
                height: '100%',
                background: 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 100%)',
                opacity: isActive ? 1 : 0,
              }}
            />
            
            {/* Active tab background - slides up/down */}
            <div
              className="absolute"
              style={{
                top: isActive ? '-20px' : '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '135px',
                height: '110px',
                backgroundColor: '#302626',
                borderRadius: '14px 14px 0 0',
                opacity: isActive ? 1 : 0,
                transition: isActive 
                  ? 'top 0.25s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.1s ease-out'
                  : 'top 0.1s ease-in, opacity 0.1s ease-in',
              }}
            >
              {/* Stroke 1 (inner) - #443936 */}
              <div 
                className="absolute pointer-events-none"
                style={{
                  top: '0px',
                  left: '0px',
                  right: '0px',
                  bottom: '0px',
                  borderRadius: '14px 14px 0 0',
                  border: '2px solid #443936',
                  borderBottom: 'none',
                }}
              />
              {/* Stroke 2 (outer) - #171515 */}
              <div 
                className="absolute pointer-events-none"
                style={{
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '0px',
                  borderRadius: '16px 16px 0 0',
                  border: '2px solid #171515',
                  borderBottom: 'none',
                }}
              />
            </div>
            
            <button 
              ref={item.id === 'BARN' ? barnButtonRef : undefined}
              onClick={() => onScreenChange(item.id)} 
              className="relative flex flex-col items-center z-10"
              style={{
                width: '135px',
                height: '100%',
                backgroundColor: 'transparent',
                justifyContent: 'flex-start',
              }}
            >
              <div 
                className="flex flex-col items-center justify-center"
                style={{
                  marginTop: isActive ? '-8px' : '12px',
                  transition: isActive 
                    ? 'margin-top 0.25s cubic-bezier(0.0, 1.2, 0.3, 1.3)'
                    : 'margin-top 0.1s ease-in',
                }}
              >
                <img 
                  src={item.icon} 
                  alt={item.label}
                  className="transition-all duration-200 ease-out"
                  style={{
                    width: isActive ? '36px' : '32px',
                    height: isActive ? '36px' : '32px',
                    filter: isActive 
                      ? 'brightness(0) saturate(100%) invert(50%) sepia(6%) saturate(500%) hue-rotate(350deg) brightness(92%) contrast(88%)'
                      : 'brightness(0) saturate(100%) invert(22%) sepia(8%) saturate(500%) hue-rotate(340deg) brightness(97%) contrast(90%)',
                  }}
                />
                {isActive && (
                  <span 
                    className="font-bold tracking-wider uppercase transition-opacity duration-300"
                    style={{
                      fontSize: '12px',
                      color: '#7f7265',
                      marginTop: '4px',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </nav>
  );
};
