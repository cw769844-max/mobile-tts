import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Share, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { subscribeGame, startGame } from '../../src/firebase/gameSync';
import { useGameStore } from '../../src/store/gameStore';
import { GameRoom } from '../../src/types/game';

export default function LobbyScreen() {
  const router = useRouter();
  const { id: gameId, role, code } = useLocalSearchParams<{ id: string; role: string; code: string }>();
  const { syncRoom, room } = useGameStore();
  const unsubRef = useRef<(() => void) | null>(null);

  const isHost = role === 'host';
  const guestJoined = !!room?.meta?.p2?.name;

  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeGame(gameId as string, (r: GameRoom | null) => {
      if (r) {
        syncRoom(r);
        if (r.state.status === 'active') {
          router.replace(`/game/${gameId}`);
        }
      }
    });
    unsubRef.current = unsub;
    return () => unsub();
  }, [gameId]);

  async function handleShare() {
    try {
      await Share.share({ message: `Join my WH40K game! Code: ${code}` });
    } catch {}
  }

  async function handleStart() {
    if (!guestJoined) {
      Alert.alert('Waiting for opponent', 'No one has joined yet.');
      return;
    }
    await startGame(gameId as string);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Lobby</Text>

      {isHost && code && (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Share this code with your opponent:</Text>
          <Text style={styles.code}>{code}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share Code</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.players}>
        <View style={styles.playerRow}>
          <View style={[styles.dot, { backgroundColor: '#2ecc71' }]} />
          <Text style={styles.playerName}>
            {room?.meta?.p1?.name ?? 'Host'} (You{isHost ? '' : 'r opponent'})
          </Text>
        </View>
        <View style={styles.playerRow}>
          {guestJoined
            ? <View style={[styles.dot, { backgroundColor: '#2ecc71' }]} />
            : <ActivityIndicator size="small" color="#555" style={{ marginRight: 8 }} />}
          <Text style={styles.playerName}>
            {guestJoined ? room?.meta?.p2?.name : 'Waiting for opponent…'}
          </Text>
        </View>
      </View>

      {isHost && (
        <TouchableOpacity
          style={[styles.startBtn, !guestJoined && styles.startBtnDisabled]}
          onPress={handleStart}
        >
          <Text style={styles.startBtnText}>Start Game</Text>
        </TouchableOpacity>
      )}

      {!isHost && (
        <View style={styles.waitingBox}>
          <ActivityIndicator color="#c0392b" />
          <Text style={styles.waitingText}>Waiting for host to start…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center',
    alignItems: 'center', padding: 32,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 32 },
  codeBox: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 24,
    alignItems: 'center', marginBottom: 32, width: '100%', maxWidth: 340,
    borderWidth: 1, borderColor: '#c0392b',
  },
  codeLabel: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  code: { fontSize: 42, fontWeight: '900', color: '#c0392b', letterSpacing: 8, marginBottom: 12 },
  shareBtn: { backgroundColor: '#c0392b', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  shareBtnText: { color: '#fff', fontWeight: '700' },
  players: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 20,
    width: '100%', maxWidth: 340, marginBottom: 32, gap: 12,
  },
  playerRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  playerName: { color: '#ddd', fontSize: 16 },
  startBtn: {
    backgroundColor: '#27ae60', paddingVertical: 16, paddingHorizontal: 48,
    borderRadius: 8, width: '100%', maxWidth: 340, alignItems: 'center',
  },
  startBtnDisabled: { backgroundColor: '#2c3e50' },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  waitingBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  waitingText: { color: '#888', fontSize: 15 },
});
