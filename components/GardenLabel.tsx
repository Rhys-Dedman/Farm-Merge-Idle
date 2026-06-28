import React from 'react';
import type { GardenId } from '../constants/gardens';
import {
  getCollectionGardenLockedIconPath,
  getCollectionGardenSectionIconPath,
  getGenericUiAssetPath,
} from '../utils/gardenAssets';

const GARDEN_LABEL_PANEL_WIDTH_PX = 320;

/** Locked inner layout — change only when retuning icon/panel/text together. */
const GARDEN_LABEL_INNER_TOP_PAD_PX = 28;
const GARDEN_LABEL_TITLE_FONT_PX = 24;
const GARDEN_LABEL_TITLE_TOP_PADDING_PX = 40;
const GARDEN_LABEL_ICON_PX = 30;
const GARDEN_LABEL_ICON_TOP_PX = 37;

export interface GardenLabelProps {
  label: string;
  gardenId?: GardenId;
  /** When set, overrides the per-garden collection icon. */
  iconSrc?: string;
  /** Moves the whole label on screen; does not affect icon/panel/text layout. */
  marginTop?: number;
  /** Gap below the label before shelves / next content. */
  marginBottom?: number;
}

/** Collection screen garden label: icon + panel + title (e.g. Flower Garden, Coming Soon). */
export const GardenLabel: React.FC<GardenLabelProps> = ({
  gardenId,
  label,
  iconSrc,
  marginTop = 0,
  marginBottom = 10,
}) => {
  const resolvedIconSrc =
    iconSrc ??
    (gardenId != null ? getCollectionGardenSectionIconPath(gardenId) : getCollectionGardenLockedIconPath());

  return (
    <div
      className="pointer-events-none shrink-0 flex justify-center"
      style={{ marginTop, marginBottom, width: `${GARDEN_LABEL_PANEL_WIDTH_PX}px` }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${GARDEN_LABEL_PANEL_WIDTH_PX}px`, paddingTop: GARDEN_LABEL_INNER_TOP_PAD_PX }}
      >
        <img
          src={getGenericUiAssetPath('ui_collection_garden.png')}
          alt=""
          className="w-full h-auto object-contain"
          draggable={false}
        />
        <img
          src={resolvedIconSrc}
          alt=""
          className="absolute left-1/2 object-contain"
          style={{
            top: GARDEN_LABEL_ICON_TOP_PX,
            width: `${GARDEN_LABEL_ICON_PX}px`,
            height: `${GARDEN_LABEL_ICON_PX}px`,
            transform: 'translate(-50%, 0)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}
          draggable={false}
        />
        <h2
          className="absolute inset-0 flex justify-center font-black tracking-tight text-center"
          style={{
            alignItems: 'center',
            paddingTop: `${GARDEN_LABEL_TITLE_TOP_PADDING_PX}px`,
            color: '#5c4a32',
            fontFamily: 'Inter, sans-serif',
            fontSize: `${GARDEN_LABEL_TITLE_FONT_PX}px`,
            lineHeight: 1,
          }}
        >
          {label}
        </h2>
      </div>
    </div>
  );
};
