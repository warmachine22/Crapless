
export type GameState = 'COME_OUT' | 'POINT_ON';

export const ALL_POINT_NUMBERS = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12] as const;
export type PointNumber = typeof ALL_POINT_NUMBERS[number];

export const PLACE_NUMBERS = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12] as const;
export type PlaceNumber = typeof PLACE_NUMBERS[number];

export type BetKey = 
  | 'passLine'
  | 'odds'
  | `place${PlaceNumber}`;

export type Bets = Partial<Record<BetKey, number>>;
