import { SecondaryCard, GambitCard, DeckState } from '../types/mission';

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function initDeck(cards: SecondaryCard[]): DeckState {
  return {
    tacticalDeck: shuffleArray(cards).map((c) => c.id),
    discardPile: [],
  };
}

export function drawCard(
  deck: DeckState,
  cards: SecondaryCard[],
): { cardId: string; newDeck: DeckState } | null {
  let remaining = [...deck.tacticalDeck];
  let discard = [...deck.discardPile];

  if (remaining.length === 0) {
    if (discard.length === 0) return null;
    remaining = shuffleArray(discard);
    discard = [];
  }

  const [cardId, ...rest] = remaining;
  return {
    cardId,
    newDeck: { tacticalDeck: rest, discardPile: [...discard, cardId] },
  };
}

export function drawGambits(cards: GambitCard[]): [GambitCard, GambitCard] {
  const shuffled = shuffleArray(cards);
  return [shuffled[0], shuffled[1]];
}
