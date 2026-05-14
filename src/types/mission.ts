import { PlayerId } from './game';

export type SecondaryMode = 'tactical' | 'fixed';

export interface SecondaryCard {
  id: string;
  name: string;
  maxVp: number;
  scoringRounds: 'each' | 'end' | 'once';
  description: string;
  category: 'control' | 'purge' | 'mission' | 'attrition';
}

export interface GambitCard {
  id: string;
  name: string;
  maxVp: number;
  description: string;
}

export interface DrawnCard {
  cardId: string;
  currentVp: number;
  maxVp: number;
  drawnRound: number;
}

export interface SecondaryHistory {
  cardId: string;
  totalVp: number;
  completedRound: number;
}

export interface PlayerSecondaryState {
  mode: SecondaryMode;
  drawnCards: DrawnCard[];
  history: SecondaryHistory[];
  gambit: { cardId: string; currentVp: number } | null;
}

export interface DeckState {
  tacticalDeck: string[];
  discardPile: string[];
}

export interface SecondaryState {
  deckState: DeckState;
  p1: PlayerSecondaryState;
  p2: PlayerSecondaryState;
}
