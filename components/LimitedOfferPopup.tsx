/**
 * Limited Offer Popup - Rewarded ad popup for boosts and bonuses.
 * Based on DiscoveryPopup but with different styling (orange theme).
 */
import React, { useEffect, useState, useRef } from 'react';
import { assetPath } from '../utils/assetPath';

interface LimitedOfferPopupProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  iconSrc?: string;
  onButtonClick?: () => void;
  appScale?: number;
}

export const LimitedOfferPopup: React.FC<LimitedOfferPopupProps> = ({
  isVisible,
  onClose,
  title,
  subtitle,
  description,
  buttonText,
  iconSrc,
  onButtonClick,
  appScale = 1,
}) => {
  const [animState, setAnimState] = useState<'hidden' | 'entering' | 'visible' | 'leaving'>('hidden');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isVisible && animState === 'hidden') {
      setAnimState('entering');
      const timer = setTimeout(() => setAnimState('visible'), 250);
      return () => clearTimeout(timer);
    } else if (!isVisible && (animState === 'visible' || animState === 'entering')) {
      setAnimState('leaving');
      const timer = setTimeout(() => setAnimState('hidden'), 150);
      return () => clearTimeout(timer);
    }
  }, [isVisible, animState]);

  if (animState === 'hidden' && !isVisible) return null;

  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';

  const handleButtonClick = () => {
    onButtonClick?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      style={{ zIndex: 100, overflow: 'hidden' }}
    >
      {/* Backdrop - not scaled, covers full screen */}
      <div
        className="absolute transition-opacity duration-300"
        style={{
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          opacity: isLeaving ? 0 : 1,
        }}
        onClick={onClose}
      />

      {/* Scaled content wrapper */}
      <div
        className="relative flex items-center justify-center"
        style={{
          transform: `scale(${appScale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Popup Container */}
        <div
          className="relative flex flex-col items-center"
          style={{
            width: '320px',
            zIndex: 102,
            animation: isEntering
              ? 'popupEnter 250ms ease-out forwards'
              : isLeaving
                ? 'popupLeave 150ms ease-in forwards'
                : 'none',
            transform: animState === 'visible' ? 'scale(1)' : undefined,
            opacity: animState === 'visible' ? 1 : undefined,
          }}
        >
          {/* Icon Circle at top */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              width: '100px',
              height: '100px',
              top: '-10px',
              zIndex: 104,
            }}
          >
            {/* Orange gradient circle */}
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #FFB347 0%, #FF8C00 100%)',
                boxShadow: '0 4px 12px rgba(255, 140, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {iconSrc && (
                <img
                  src={iconSrc}
                  alt=""
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>
          </div>

          {/* Main popup body */}
          <div
            style={{
              width: '100%',
              marginTop: '40px',
              padding: '60px 24px 24px 24px',
              background: 'linear-gradient(180deg, #FFF8E7 0%, #FFF2D6 100%)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              border: '3px solid #E8D5B0',
            }}
          >
            {/* Title - "Limited Offer" style */}
            <div
              className="text-center"
              style={{
                color: '#D4883A',
                fontSize: '16px',
                fontWeight: 500,
                fontStyle: 'italic',
                marginBottom: '4px',
              }}
            >
              {title}
            </div>

            {/* Subtitle - Main heading */}
            <div
              className="text-center"
              style={{
                color: '#5C4A32',
                fontSize: '28px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              {subtitle}
            </div>

            {/* Decorative divider with leaves */}
            <div
              className="flex items-center justify-center gap-2"
              style={{ marginBottom: '12px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, #D4A76A)',
                }}
              />
              <span style={{ color: '#8BC34A', fontSize: '16px' }}>🌱</span>
              <div
                style={{
                  width: '40px',
                  height: '1px',
                  background: 'linear-gradient(90deg, #D4A76A, transparent)',
                }}
              />
            </div>

            {/* Description */}
            <div
              className="text-center"
              style={{
                color: '#D4883A',
                fontSize: '15px',
                fontWeight: 500,
                lineHeight: 1.4,
                marginBottom: '20px',
                padding: '0 8px',
              }}
            >
              {description}
            </div>

            {/* Accept Button with ad icon */}
            <button
              ref={buttonRef}
              onClick={handleButtonClick}
              className="w-full flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                padding: '14px 24px',
                background: 'linear-gradient(180deg, #FFB347 0%, #FF9500 100%)',
                borderRadius: '12px',
                border: '2px solid #E88A00',
                boxShadow: '0 4px 8px rgba(255, 140, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                color: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 700,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer',
              }}
            >
              {/* Ad/Video icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ opacity: 0.9 }}
              >
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                <polygon points="10,8 10,16 16,12" fill="currentColor" />
              </svg>
              {buttonText}
            </button>
          </div>

          {/* Close Button - X */}
          <button
            onClick={onClose}
            className="absolute w-8 h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              top: '36px',
              right: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '50%',
              border: 'none',
              color: '#8B7355',
              zIndex: 105,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
