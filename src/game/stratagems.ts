import { appendStratagemLog, adjustCP } from '../firebase/gameSync';
import { GamePhase, PlayerId, StratagemLog } from '../types/game';
import { Stratagem } from '../types/stratagem';

export async function useStratagem(
  gameId: string,
  player: PlayerId,
  stratagem: Stratagem,
  currentRound: number,
  currentPhase: GamePhase,
): Promise<void> {
  const entry: StratagemLog = {
    round: currentRound,
    phase: currentPhase,
    player,
    stratagemName: stratagem.name,
    cpCost: stratagem.cost,
    timestamp: Date.now(),
  };
  await Promise.all([
    adjustCP(gameId, player, -stratagem.cost),
    appendStratagemLog(gameId, entry),
  ]);
}
