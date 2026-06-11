import React from 'react';
import {
  FLOATING_BUTTON_STACK_ITEM_GAP_PX,
  FLOATING_BUTTON_STACK_LEFT_PX,
  FLOATING_BUTTON_STACK_RIGHT_PX,
  FLOATING_BUTTON_STACK_TOP_PX,
} from '../constants/floatingButtonLayout';

export type FloatingButtonStackSide = 'left' | 'right';

export interface FloatingButtonStackProps {
  children: React.ReactNode;
  className?: string;
  side?: FloatingButtonStackSide;
  topPx?: number;
  leftPx?: number;
  rightPx?: number;
  style?: React.CSSProperties;
}

export const FloatingButtonStack: React.FC<FloatingButtonStackProps> = ({
  children,
  className = '',
  side = 'left',
  topPx = FLOATING_BUTTON_STACK_TOP_PX,
  leftPx = FLOATING_BUTTON_STACK_LEFT_PX,
  rightPx = FLOATING_BUTTON_STACK_RIGHT_PX,
  style,
}) => {
  const horizontalStyle =
    side === 'right'
      ? { right: rightPx }
      : { left: leftPx };

  return (
    <div
      className={`pointer-events-none absolute z-[15] ${className}`}
      style={{ top: topPx, ...horizontalStyle, ...style }}
    >
      <div
        className={`pointer-events-auto flex flex-col ${side === 'right' ? 'items-end' : 'items-start'}`}
        style={{ gap: FLOATING_BUTTON_STACK_ITEM_GAP_PX }}
      >
        {children}
      </div>
    </div>
  );
};
