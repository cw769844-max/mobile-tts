import { GamePhase, PlayerId, GameState } from '../types/game';

export const PHASE_ORDER: GamePhase[] = [
  'command', 'movement', 'shooting', 'charge', 'fight',
];

export const PHASE_LABELS: Record<GamePhase, string> = {
  command: 'Command Phase',
  movement: 'Movement Phase',
  shooting: 'Shooting Phase',
  charge: 'Charge Phase',
  fight: 'Fight Phase',
};

export const PHASE_COLORS: Record<GamePhase, string> = {
  command: '#6c3483',
  movement: '#1a5276',
  shooting: '#7b241c',
  charge: '#784212',
  fight: '#145a32',
};

export function nextState(current: GameState): GameState {
  const idx = PHASE_ORDER.indexOf(current.phase);
  const isLastPhase = idx === PHASE_ORDER.length - 1;

  if (!isLastPhase) {
    return { ...current, phase: PHASE_ORDER[idx + 1] };
  }

  // End of fight phase — switch player or increment round
  if (current.activePlayer === 'p1') {
    return { ...current, phase: 'command', activePlayer: 'p2' };
  }

  const newRound = current.round + 1;
  if (newRound > 5) {
    return { ...current, status: 'ended' };
  }
  return { round: newRound, phase: 'command', activePlayer: 'p1', status: 'active' };
}

export function isCommandPhase(state: GameState): boolean {
  return state.phase === 'command';
}
