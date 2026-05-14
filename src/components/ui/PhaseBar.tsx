import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { useTimerStore } from '../../store/timerStore';
import { PHASE_ORDER, PHASE_LABELS, PHASE_COLORS } from '../../game/phases';
import { PlayerId } from '../../types/game';

const PLAYER_LABELS: Record<PlayerId, string> = { p1: 'Player 1', p2: 'Player 2' };
const PLAYER_COLORS: Record<PlayerId, string> = { p1: '#3498db', p2: '#c0392b' };

interface PhaseBarProps {
  onTimerPress: () => void;
}

export function PhaseBar({ onTimerPress }: PhaseBarProps) {
  const room = useGameStore((s) => s.room);
  const localPlayer = useGameStore((s) => s.localPlayer);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const timerEnabled = useTimerStore((s) => s.enabled);

  if (!room) return null;
  const { state } = room;
  const isMyTurn = state.activePlayer === localPlayer;
  const phaseColor = PHASE_COLORS[state.phase];

  return (
    <View style={styles.container}>
      {/* Round pips */}
      <View style={styles.rounds}>
        {[1, 2, 3, 4, 5].map((r) => (
          <View
            key={r}
            style={[styles.roundPip, r === state.round && styles.roundPipActive]}
          >
            <Text style={[styles.roundPipText, r === state.round && styles.roundPipTextActive]}>
              {r}
            </Text>
          </View>
        ))}
      </View>

      {/* Phase indicator */}
      <View style={[styles.phaseChip, { backgroundColor: phaseColor }]}>
        <Text style={styles.phaseText}>{PHASE_LABELS[state.phase]}</Text>
      </View>

      {/* Active player */}
      <View style={[styles.playerChip, { borderColor: PLAYER_COLORS[state.activePlayer] }]}>
        <View style={[styles.playerDot, { backgroundColor: PLAYER_COLORS[state.activePlayer] }]} />
        <Text style={styles.playerText}>{PLAYER_LABELS[state.activePlayer]}</Text>
      </View>

      {/* Timer button */}
      {timerEnabled && (
        <TouchableOpacity style={styles.timerBtn} onPress={onTimerPress}>
          <Text style={styles.timerIcon}>⏱</Text>
        </TouchableOpacity>
      )}

      {/* End Phase button */}
      <TouchableOpacity
        style={[styles.endPhaseBtn, !isMyTurn && styles.endPhaseBtnDisabled]}
        onPress={isMyTurn ? advancePhase : undefined}
        disabled={!isMyTurn}
      >
        <Text style={styles.endPhaseText}>
          {isMyTurn ? 'End Phase →' : 'Opponent\'s turn'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 12, paddingVertical: 6, gap: 8,
  },
  rounds: { flexDirection: 'row', gap: 4 },
  roundPip: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#2c3e50',
    justifyContent: 'center', alignItems: 'center',
  },
  roundPipActive: { backgroundColor: '#f39c12' },
  roundPipText: { color: '#777', fontSize: 11, fontWeight: '700' },
  roundPipTextActive: { color: '#1a1a2e' },
  phaseChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  phaseText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  playerChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, gap: 5,
  },
  playerDot: { width: 8, height: 8, borderRadius: 4 },
  playerText: { color: '#fff', fontSize: 12 },
  timerBtn: { padding: 4 },
  timerIcon: { fontSize: 18 },
  endPhaseBtn: {
    marginLeft: 'auto', backgroundColor: '#27ae60', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 6,
  },
  endPhaseBtnDisabled: { backgroundColor: '#2c3e50' },
  endPhaseText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
