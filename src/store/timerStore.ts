import { create } from 'zustand';
import { PlayerId } from '../types/game';

interface TimerStore {
  enabled: boolean;
  p1Remaining: number;
  p2Remaining: number;
  activePlayer: PlayerId | null;
  running: boolean;

  configure: (minutesPerPlayer: number) => void;
  start: (firstPlayer: PlayerId) => void;
  pause: () => void;
  resume: () => void;
  switchPlayer: (to: PlayerId) => void;
  tick: () => void;
  reset: (minutesPerPlayer: number) => void;
}

export const useTimerStore = create<TimerStore>()((set, get) => ({
  enabled: false,
  p1Remaining: 75 * 60,
  p2Remaining: 75 * 60,
  activePlayer: null,
  running: false,

  configure: (minutesPerPlayer) => set({
    enabled: true,
    p1Remaining: minutesPerPlayer * 60,
    p2Remaining: minutesPerPlayer * 60,
    activePlayer: null,
    running: false,
  }),

  start: (firstPlayer) => set({ activePlayer: firstPlayer, running: true }),

  pause: () => set({ running: false }),

  resume: () => set({ running: true }),

  switchPlayer: (to) => set({ activePlayer: to }),

  tick: () => {
    const { running, activePlayer, p1Remaining, p2Remaining } = get();
    if (!running || !activePlayer) return;
    if (activePlayer === 'p1' && p1Remaining > 0) {
      set({ p1Remaining: p1Remaining - 1 });
    } else if (activePlayer === 'p2' && p2Remaining > 0) {
      set({ p2Remaining: p2Remaining - 1 });
    }
  },

  reset: (minutesPerPlayer) => set({
    p1Remaining: minutesPerPlayer * 60,
    p2Remaining: minutesPerPlayer * 60,
    activePlayer: null,
    running: false,
  }),
}));
