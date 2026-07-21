/**
 * Starter Pack popup — garden 1 level-4 limited IAP offer.
 * Field Pack (garden 2+) uses `FieldPackPopup.tsx`.
 */
import React from 'react';
import { IapOfferPopup, type IapOfferPopupProps } from './IapOfferPopup';

export type StarterPackPopupProps = Omit<IapOfferPopupProps, 'title' | 'leafBurstVariant'> & {
  /** Defaults to "Starter Pack". */
  title?: string;
};

export const StarterPackPopup: React.FC<StarterPackPopupProps> = ({
  title = 'Starter Pack',
  ...rest
}) => (
  <IapOfferPopup
    {...rest}
    title={title}
    leafBurstVariant="starter"
  />
);
