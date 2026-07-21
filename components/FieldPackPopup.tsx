/**
 * Field Pack popup — garden 2+ level-4 limited IAP offer.
 * Same premium purple shell as Starter Pack today; own component so title/copy/rewards/chrome
 * can diverge later without touching the Starter Pack path.
 */
import React from 'react';
import { IapOfferPopup, type IapOfferPopupProps } from './IapOfferPopup';

export type FieldPackPopupProps = Omit<IapOfferPopupProps, 'title' | 'leafBurstVariant'> & {
  /** Defaults to "Field Pack". */
  title?: string;
};

export const FieldPackPopup: React.FC<FieldPackPopupProps> = ({
  title = 'Field Pack',
  ...rest
}) => (
  <IapOfferPopup
    {...rest}
    title={title}
    leafBurstVariant="starter"
  />
);
