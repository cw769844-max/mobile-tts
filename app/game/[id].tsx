import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { subscribeGame, uploadImage, upsertToken, setConnected } from '../../src/firebase/gameSync';
import { useGameStore } from '../../src/store/gameStore';
import { useTimerStore } from '../../src/store/timerStore';
import { GameBoard } from '../../src/components/board/GameBoard';
import { PhaseBar } from '../../src/components/ui/PhaseBar';
import { MeasureToolbar } from '../../src/components/ui/MeasureToolbar';
import { ScorePanel } from '../../src/components/ui/ScorePanel';
import { DiceRoller } from '../../src/components/ui/DiceRoller';
import { TokenSheet } from '../../src/components/token/TokenSheet';
import { TurnTimer } from '../../src/components/ui/TurnTimer';
import { DEFAULT_STATS } from '../../src/types/game';
import { v4 as uuidv4 } from 'uuid';

export default function GameScreen() {
  const router = useRouter();
  const { id: gameId } = useLocalSearchParams<{ id: string }>();
  const { syncRoom, room, localPlayer, selectedTokenId, selectToken } = useGameStore();
  const timerConfig = useTimerStore((s) => ({ enabled: s.enabled, configure: s.configure, start: s.start }));

  const [showScore, setShowScore] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [uploading, setUploading] = useState(false);

  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const unsub = subscribeGame(gameId, (r) => {
      if (r) syncRoom(r);
    });
    unsubRef.current = unsub;

    // Initialize timer from game config
    if (room?.config.timerEnabled) {
      timerConfig.configure(room.config.minutesPerPlayer);
      timerConfig.start(room.state.activePlayer);
    }

    return () => unsub();
  }, [gameId]);

  // Android back button guard
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Leave Game?', 'Your opponent will see you as disconnected.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.replace('/') },
      ]);
      return true;
    });
    return () => sub.remove();
  }, []);

  async function handleAddToken() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    if (!gameId || !localPlayer) return;

    setUploading(true);
    try {
      const downloadUrl = await uploadImage(
        result.assets[0].uri,
        `games/${gameId}/tokens/${uuidv4()}.jpg`,
      );
      const token = {
        id: uuidv4(),
        name: 'New Unit',
        ownerId: localPlayer,
        x: 200,
        y: 200,
        imageUrl: downloadUrl,
        stats: DEFAULT_STATS,
        woundsRemaining: DEFAULT_STATS.W,
        status: { battleShocked: false, inReserve: false, hasActivated: false },
        sizeInches: 1,
        isObjective: false,
      };
      await upsertToken(gameId, token);
    } finally {
      setUploading(false);
    }
  }

  // End game screen
  if (room?.state.status === 'ended') {
    const p1Score = room.scores.p1.vp;
    const p2Score = room.scores.p2.vp;
    const winner = p1Score > p2Score ? room.meta.p1.name
      : p2Score > p1Score ? room.meta.p2?.name ?? 'Player 2'
      : null;

    return (
      <View style={styles.endGame}>
        <Text style={styles.endTitle}>Game Over</Text>
        <Text style={styles.endSubtitle}>{winner ? `${winner} wins!` : 'Draw!'}</Text>
        <View style={styles.endScores}>
          <Text style={styles.endScore}>{room.meta.p1.name}: {p1Score} VP</Text>
          <Text style={styles.endScore}>{room.meta.p2?.name ?? 'P2'}: {p2Score} VP</Text>
        </View>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
          <Text style={styles.homeBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <PhaseBar onTimerPress={() => setShowTimer(true)} />

      {/* Board */}
      <GameBoard />

      {/* Bottom toolbar */}
      <View style={styles.bottomBar}>
        <MeasureToolbar />
        <View style={styles.actionBtns}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAddToken} disabled={uploading}>
            <Text style={styles.actionBtnText}>{uploading ? '⏳' : '+ Token'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowDice(true)}>
            <Text style={styles.actionBtnText}>🎲 Dice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowScore(true)}>
            <Text style={styles.actionBtnText}>📊 Score</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <ScorePanel visible={showScore} onClose={() => setShowScore(false)} />
      <DiceRoller visible={showDice} onClose={() => setShowDice(false)} />
      <TurnTimer visible={showTimer} onClose={() => setShowTimer(false)} />
      <TokenSheet
        tokenId={selectedTokenId}
        visible={!!selectedTokenId}
        onClose={() => selectToken(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bottomBar: { backgroundColor: 'rgba(0,0,0,0.85)' },
  actionBtns: { flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#16213e', borderWidth: 1, borderColor: '#333',
  },
  actionBtnText: { color: '#ddd', fontWeight: '700', fontSize: 13 },
  endGame: {
    flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center',
    alignItems: 'center', padding: 40,
  },
  endTitle: { fontSize: 48, fontWeight: '900', color: '#f39c12', marginBottom: 8 },
  endSubtitle: { fontSize: 24, color: '#fff', fontWeight: '700', marginBottom: 32 },
  endScores: { gap: 8, marginBottom: 40 },
  endScore: { fontSize: 20, color: '#ccc', textAlign: 'center' },
  homeBtn: { backgroundColor: '#c0392b', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 10 },
  homeBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
