
import React from 'react';

interface SideActionProps {
  label: string;
  icon: string;
  progress: number;
  color: string;
  isActive?: boolean;
  isFlashing?: boolean;
  shouldAnimate?: boolean;
  isBoardFull?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const SideAction: React.FC<SideActionProps> = ({ 
  label, 
  icon, 
  progress, 
  color, 
  isActive, 
  isFlashing, 
  shouldAnimate = true,
  isBoardFull = false,
  onClick 
}) => {
  // Base Radius and Expanded Radius
  const baseRadius = 38;
  const expandedRadius = baseRadius * 1.1; // 10% increase = 41.8
  
  // Current Radius based on state
  const currentRadius = isFlashing ? expandedRadius : baseRadius;
  const circumference = 2 * Math.PI * currentRadius;
  
  // Immediately hide the "successful progress" part when flashing or at 100%
  // This ensures the player never sees the 100% ring, just the transition to 0%
  const displayProgress = (isFlashing || progress >= 1) ? 0 : progress;
  const strokeDashoffset = circumference - (displayProgress * circumference);

  const isUrl = icon.startsWith('http');

  // We want the 'r' attribute to transition smoothly
  // And the 'stroke-dashoffset' to transition when not flashing/0
  const transitionStyle = (isFlashing || displayProgress === 0) 
    ? 'none' 
    : 'stroke-dashoffset 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

  // Art Colors
  const progressBgColor = 'rgba(48, 56, 30, 0.5)';
  const completedProgressColor = '#76953e';

  return (
    <div className="flex flex-col items-center select-none group" onClick={onClick}>
      <div className={`relative w-24 h-24 flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-200 ${isFlashing && shouldAnimate ? 'scale-110' : ''}`}>
        
        {/* SVG Circular Progress & Decoration */}
        <svg className="absolute inset-0 w-full h-full drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]" viewBox="0 0 100 100">
          <defs>
            {/* Standard Green Gradient for the button body */}
            <linearGradient id={`btn-grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#577741" />
              <stop offset="100%" stopColor="#39502e" />
            </linearGradient>

            {/* Light Rim/Flash Gradient (Top #fcf0c6, Bottom #cad870) */}
            <linearGradient id={`light-grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fcf0c6" />
              <stop offset="100%" stopColor="#cad870" />
            </linearGradient>
          </defs>

          {/* Light Outer Border Ring - Now uses the vertical gradient */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill={`url(#light-grad-${label})`}
            style={{
              filter: 'none'
            }}
          />
          
          {/* Inner Gradient Body - Radius 43 */}
          {/* Uses light-grad when flashing, else standard green grad */}
          <circle
            cx="50"
            cy="50"
            r="43"
            fill={isFlashing ? `url(#light-grad-${label})` : `url(#btn-grad-${label})`}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />

          {/* Incomplete Progress Track (Background) */}
          <circle
            cx="50"
            cy="50"
            r={currentRadius}
            fill="transparent"
            stroke={progressBgColor}
            strokeWidth="2.88"
            style={{ 
              transition: 'r 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' 
            }}
          />

          {/* Progress Bar Ring - Hidden immediately when flashing or 100% */}
          <circle
            cx="50"
            cy="50"
            r={currentRadius}
            fill="transparent"
            stroke={isFlashing ? progressBgColor : completedProgressColor}
            strokeWidth="2.88"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset, 
              transition: `${transitionStyle}, r 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.3s ease`,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              opacity: (progress >= 1 && !isFlashing) ? 0 : 1
            }}
          />
        </svg>

        {/* Content Icon */}
        <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
          isFlashing && shouldAnimate ? 'scale-110 rotate-12' : isActive ? 'scale-105' : 'scale-100'
        }`}>
          {isUrl ? (
            <img 
              src={icon} 
              alt={label} 
              className="w-10 h-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
            />
          ) : (
            <span className="text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] select-none">
              {icon}
            </span>
          )}
          {/* Subtle Shine Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
        </div>

        {/* Full Badge - Appearing at the bottom when board is full and action is ready */}
        {isFlashing && isBoardFull && (
          <div 
            className="absolute bottom-[-6px] px-[12px] py-[3px] shadow-md border-2 z-20 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ 
              backgroundImage: 'linear-gradient(to bottom, #fcf0c6, #d0df6f)',
              borderColor: '#7c8741',
              borderRadius: '999px' // Full curve, no flats
            }}
          >
            <span 
              className="text-[11.25px] font-black uppercase tracking-widest leading-none"
              style={{ color: '#475c3b' }}
            >
              FULL
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
