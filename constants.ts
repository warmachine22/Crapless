
import type { PlaceNumber, PointNumber } from './types';

export const CHIP_VALUES = [1, 5, 10, 25, 100];
export const STARTING_BANKROLL = 100;

export const ODDS_PAYOUTS: Record<PointNumber, {n: number; d: number}> = {
  2: { n: 6, d: 1 },
  12: { n: 6, d: 1 },
  3: { n: 3, d: 1 },
  11: { n: 3, d: 1 },
  4: { n: 2, d: 1 },
  10: { n: 2, d: 1 },
  5: { n: 3, d: 2 },
  9: { n: 3, d: 2 },
  6: { n: 6, d: 5 },
  8: { n: 6, d: 5 },
};

export const PLACE_PAYOUTS: Record<PlaceNumber, {n: number; d: number}> = {
  2: { n: 11, d: 2 },
  12: { n: 11, d: 2 },
  3: { n: 11, d: 4 },
  11: { n: 11, d: 4 },
  4: { n: 9, d: 5 },
  10: { n: 9, d: 5 },
  5: { n: 7, d: 5 },
  9: { n: 7, d: 5 },
  6: { n: 7, d: 6 },
  8: { n: 7, d: 6 },
};