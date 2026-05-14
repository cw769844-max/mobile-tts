import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTimerStore } from '../../store/timerStore';
import { PlayerId } from '../../types/game';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function timeColor(seconds: number): string {
  if (seconds <= 5 * 60) return '#e74c3c';
  if (seconds <= 15 * 60) return '#f39c12';
  return '#2ecc71';
}

interface TimerClockProps {
  player: PlayerId;
  remaining: number;
  isActive: boolean;
}

function TimerClock({ player, remaining, isActive }: TimerClockProps) {
  const color = timeColor(remaining);
  return (
    <View style={[styles.clock, isActive && styles.clockActive]}>
      <Text style={styles.playerLabel}>{player === 'p1' ? 'P1' : 'P2'}</Text>
      <Text style={[styles.time, { color }]}>{formatTime(remaining)}</Text>
    </View>
  );
}

interface TurnTimerProps {
  visible: boolean;
  onClose: () => void;
}

export function TurnTimer({ visible, onClose }: TurnTimerProps) {
  const { p1Remaining, p2Remaining, activePlayer, running, tick, pause, resume } = useTimerStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Haptic alerts at 10 and 5 min marks
  useEffect(() => {
    const active = activePlayer === 'p1' ? p1Remaining : p2Remaining;
    if (active === 10 * 60 || active === 5 * 60) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [p1Remaining, p2Remaining]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Turn Timer</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.clocks}>
            <TimerClock player="p1" remaining={p1Remaining} isActive={activePlayer === 'p1'} />
            <TimerClock player="p2" remaining={p2Remaining} isActive={activePlayer === 'p2'} />
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlBtn, running ? styles.pauseBtn : styles.resumeBtn]}
              onPress={running ? pause : resume}
            >
              <Text style={styles.controlBtnText}>{running ? 'Pause' : 'Resume'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  panel: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 24,
    width: '80%', maxWidth: 360,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  closeBtn: { color: '#888', fontSize: 20 },
  clocks: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  clock: {
    flex: 1, backgroundColor: '#0d1117', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 2, borderColor: '#333',
  },
  clockActive: { borderColor: '#f39c12' },
  playerLabel: { color: '#888', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  time: { fontSize: 32, fontWeight: '900' },
  controls: { flexDirection: 'row', justifyContent: 'center' },
  controlBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  pauseBtn: { backgroundColor: '#e67e22' },
  resumeBtn: { backgroundColor: '#27ae60' },
  controlBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
