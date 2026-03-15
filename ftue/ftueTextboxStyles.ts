/**
 * Default FTUE textbox styles – use for all FTUE textboxes (with or without button).
 * Keep these locked in for consistency across welcome, seed_tap, and future steps.
 */

export const FTUE_TEXTBOX = {
  width: '480px',
  padding: '18px 10px',
  backgroundColor: '#fcf0c6',
  borderRadius: '24px',
  boxShadow: '0 1px 14px rgba(0,0,0,0.96), inset 0 0 0 1.5px #e9dcaf',
  border: '2px solid rgba(180, 165, 130, 0.4)',
} as const;

export const FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM = '14px';

export const FTUE_TEXTBOX_TEXT = {
  color: '#775041',
  fontFamily: 'Inter, sans-serif',
  fontSize: '24px',
  textAlign: 'center' as const,
} as const;
