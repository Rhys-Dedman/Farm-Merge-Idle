/**
 * Shown after the primary save fails to load and a level-up checkpoint was restored.
 */
import React from 'react';
import { assetPath } from '../utils/assetPath';
import { FtuePopup } from './FtuePopup';

export const CORRUPT_SAVE_POPUP_TITLE = 'Save Restored';
export const CORRUPT_SAVE_POPUP_DESCRIPTION =
  'Your save was damaged. We restored a backup — you may have lost a little progress.';
/** Friendly “we’ve got you” icon (same family as offline welcome). */
export const CORRUPT_SAVE_POPUP_HEADER_ICON = assetPath(
  '/assets/icons/upgrades/icon_happycustomer.png',
);

interface CorruptSavePopupProps {
  isVisible: boolean;
  onClose: () => void;
  appScale?: number;
}

export const CorruptSavePopup: React.FC<CorruptSavePopupProps> = ({
  isVisible,
  onClose,
  appScale = 1,
}) => (
  <FtuePopup
    isVisible={isVisible}
    onClose={onClose}
    blockBackdropClick
    header={{ icon: CORRUPT_SAVE_POPUP_HEADER_ICON }}
    title={CORRUPT_SAVE_POPUP_TITLE}
    titleFontSizeRem={4.5}
    showDivider
    description={CORRUPT_SAVE_POPUP_DESCRIPTION}
    button={{ text: 'Lets Play' }}
    burstWidth={260}
    burstHeight={320}
    appScale={appScale}
  />
);
