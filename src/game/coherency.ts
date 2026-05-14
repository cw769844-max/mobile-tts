import { Token } from '../types/game';
import { distancePx } from './scaling';

export interface CoherencyResult {
  tokenId: string;
  isInCoherence: boolean;
  closestDistancePx: number;
}

// Groups tokens by ownerId + name, then checks 2" coherency within each group.
// coherencyRadiusPx = 2 inches converted to pixels.
export function checkCoherence(
  tokens: Token[],
  inchesPerPx: number,
): Map<string, CoherencyResult> {
  const coherencyInches = 2;
  const coherencyPx = coherencyInches / inchesPerPx;

  const results = new Map<string, CoherencyResult>();

  // Group tokens that belong to the same named unit per player
  const unitGroups = new Map<string, Token[]>();
  for (const token of tokens) {
    if (token.isObjective || token.status.inReserve) continue;
    const key = `${token.ownerId}:${token.name}`;
    if (!unitGroups.has(key)) unitGroups.set(key, []);
    unitGroups.get(key)!.push(token);
  }

  for (const group of unitGroups.values()) {
    if (group.length <= 1) {
      if (group.length === 1) {
        results.set(group[0].id, { tokenId: group[0].id, isInCoherence: true, closestDistancePx: 0 });
      }
      continue;
    }

    for (const token of group) {
      const others = group.filter((t) => t.id !== token.id);
      let closest = Infinity;
      for (const other of others) {
        const d = distancePx(token.x, token.y, other.x, other.y);
        if (d < closest) closest = d;
      }
      results.set(token.id, {
        tokenId: token.id,
        isInCoherence: closest <= coherencyPx,
        closestDistancePx: closest,
      });
    }
  }

  return results;
}
