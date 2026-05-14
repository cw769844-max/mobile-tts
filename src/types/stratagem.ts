import { GamePhase, PlayerId } from './game';

export interface Stratagem {
  id: string;
  name: string;
  cost: 1 | 2 | 3;
  phase: GamePhase | 'any';
  timing: string;
  effect: string;
  restrictions?: string;
  isCustom: boolean;
  usedThisPhase?: boolean;
}
