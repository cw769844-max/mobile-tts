import { DieType, DiceRollResult } from '../types/game';

export function rollD6(): number { return Math.floor(Math.random() * 6) + 1; }
export function rollD3(): number { return Math.ceil(Math.random() * 3); }
export function rollD2(): number { return Math.random() < 0.5 ? 1 : 2; }

export function rollNd6(n: number): number[] {
  return Array.from({ length: n }, rollD6);
}

export function applyRerolls(
  rolls: number[],
  mode: 'none' | 'ones' | 'all',
  roller: () => number,
): number[] {
  return rolls.map((r) => {
    if (mode === 'all' || (mode === 'ones' && r === 1)) return roller();
    return r;
  });
}

export function rollDice(type: DieType, count = 1): DiceRollResult {
  let results: number[];
  switch (type) {
    case 'D2':
      results = Array.from({ length: count }, rollD2);
      break;
    case 'D3':
      results = Array.from({ length: count }, rollD3);
      break;
    case '2D6':
      results = [rollD6() + rollD6()];
      break;
    case 'D6':
    default:
      results = Array.from({ length: count }, rollD6);
  }
  return { dieType: type, count, results, total: results.reduce((a, b) => a + b, 0) };
}
