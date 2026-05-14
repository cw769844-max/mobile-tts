import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  GameRoom, Token, PlayerId, GameState, GameConfig, VpEntry, PlayerScore,
} from '../types/game';
import {
  upsertToken, updateTokenPosition, updateTokenData, removeToken as fbRemoveToken,
  updateGameState, updateConfig, incrementVP, adjustCP, appendVpLog,
} from '../firebase/gameSync';
import { nextState, isCommandPhase } from '../game/phases';
import { v4 as uuidv4 } from 'uuid';

interface GameStore {
  gameId: string | null;
  localPlayer: PlayerId | null;
  room: GameRoom | null;
  draggingTokenId: string | null;
  selectedTokenId: string | null;

  // Called by the Firebase listener
  syncRoom: (room: GameRoom | null) => void;
  setGameId: (id: string, player: PlayerId) => void;

  // Token actions
  addToken: (token: Omit<Token, 'id'>) => Promise<void>;
  moveToken: (tokenId: string, x: number, y: number) => Promise<void>;
  editToken: (tokenId: string, partial: Partial<Token>) => Promise<void>;
  deleteToken: (tokenId: string) => Promise<void>;
  setDraggingToken: (id: string | null) => void;
  selectToken: (id: string | null) => void;

  // Phase/turn
  advancePhase: () => Promise<void>;
  updateGameConfig: (partial: Partial<GameConfig>) => Promise<void>;

  // Scoring
  addVP: (player: PlayerId, amount: number, reason: string) => Promise<void>;
  spendCP: (player: PlayerId) => Promise<void>;
  gainCP: (player: PlayerId, amount?: number) => Promise<void>;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    gameId: null,
    localPlayer: null,
    room: null,
    draggingTokenId: null,
    selectedTokenId: null,

    setGameId: (id, player) => {
      set((s) => {
        s.gameId = id;
        s.localPlayer = player;
      });
    },

    syncRoom: (room) => {
      set((s) => {
        if (!room) return;
        const dragging = s.draggingTokenId;
        if (dragging && s.room?.tokens[dragging] && room.tokens[dragging]) {
          // Preserve local dragging position to prevent snap-back mid-drag
          room.tokens[dragging] = {
            ...room.tokens[dragging],
            x: s.room.tokens[dragging].x,
            y: s.room.tokens[dragging].y,
          };
        }
        s.room = room;
      });
    },

    addToken: async (tokenData) => {
      const { gameId } = get();
      if (!gameId) return;
      const token: Token = { ...tokenData, id: uuidv4() };
      set((s) => { if (s.room) s.room.tokens[token.id] = token; });
      await upsertToken(gameId, token);
    },

    moveToken: async (tokenId, x, y) => {
      const { gameId } = get();
      if (!gameId) return;
      set((s) => {
        if (s.room?.tokens[tokenId]) {
          s.room.tokens[tokenId].x = x;
          s.room.tokens[tokenId].y = y;
        }
      });
      await updateTokenPosition(gameId, tokenId, x, y);
    },

    editToken: async (tokenId, partial) => {
      const { gameId } = get();
      if (!gameId) return;
      set((s) => {
        if (s.room?.tokens[tokenId]) {
          Object.assign(s.room.tokens[tokenId], partial);
        }
      });
      await updateTokenData(gameId, tokenId, partial);
    },

    deleteToken: async (tokenId) => {
      const { gameId } = get();
      if (!gameId) return;
      set((s) => { if (s.room) delete s.room.tokens[tokenId]; });
      await fbRemoveToken(gameId, tokenId);
    },

    setDraggingToken: (id) => set((s) => { s.draggingTokenId = id; }),
    selectToken: (id) => set((s) => { s.selectedTokenId = id; }),

    advancePhase: async () => {
      const { gameId, room } = get();
      if (!gameId || !room) return;
      const newState = nextState(room.state);
      set((s) => { if (s.room) s.room.state = newState; });
      await updateGameState(gameId, newState);
      // Auto-grant 1 CP at start of Command phase
      if (isCommandPhase(newState) && newState.status === 'active') {
        await adjustCP(gameId, newState.activePlayer, 1);
      }
    },

    updateGameConfig: async (partial) => {
      const { gameId } = get();
      if (!gameId) return;
      set((s) => { if (s.room) Object.assign(s.room.config, partial); });
      await updateConfig(gameId, partial);
    },

    addVP: async (player, amount, reason) => {
      const { gameId, room } = get();
      if (!gameId || !room) return;
      const entry: VpEntry = {
        round: room.state.round, player, amount, reason, timestamp: Date.now(),
      };
      await Promise.all([
        incrementVP(gameId, player, amount),
        appendVpLog(gameId, entry),
      ]);
    },

    spendCP: async (player) => {
      const { gameId } = get();
      if (!gameId) return;
      await adjustCP(gameId, player, -1);
    },

    gainCP: async (player, amount = 1) => {
      const { gameId } = get();
      if (!gameId) return;
      await adjustCP(gameId, player, amount);
    },
  })),
);
