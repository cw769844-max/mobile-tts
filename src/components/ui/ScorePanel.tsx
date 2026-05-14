import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { PlayerId, VpEntry } from '../../types/game';

const PLAYER_LABELS: Record<PlayerId, string> = { p1: 'Player 1', p2: 'Player 2' };
const PLAYER_COLORS: Record<PlayerId, string> = { p1: '#3498db', p2: '#c0392b' };

interface AddVPModalProps {
  player: PlayerId;
  visible: boolean;
  onClose: () => void;
}

function AddVPModal({ player, visible, onClose }: AddVPModalProps) {
  const addVP = useGameStore((s) => s.addVP);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  async function submit() {
    const n = parseInt(amount, 10);
    if (isNaN(n) || n <= 0) return Alert.alert('Enter a valid VP amount');
    await addVP(player, n, reason || 'Manual entry');
    setAmount('');
    setReason('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Add VP — {PLAYER_LABELS[player]}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Amount"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Reason (e.g. Primary: Hold 3)"
            placeholderTextColor="#666"
            value={reason}
            onChangeText={setReason}
          />
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={submit}>
              <Text style={styles.confirmBtnText}>Add VP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface ScorePanelProps {
  visible: boolean;
  onClose: () => void;
}

export function ScorePanel({ visible, onClose }: ScorePanelProps) {
  const room = useGameStore((s) => s.room);
  const localPlayer = useGameStore((s) => s.localPlayer);
  const { spendCP, gainCP } = useGameStore();
  const [addVPFor, setAddVPFor] = useState<PlayerId | null>(null);

  if (!room) return null;

  function renderPlayer(player: PlayerId) {
    const score = room!.scores[player];
    const isLocal = player === localPlayer;
    const log: VpEntry[] = score.vpLog
      ? Object.values(score.vpLog as unknown as Record<string, VpEntry>)
      : [];

    return (
      <View style={[styles.playerCol, { borderColor: PLAYER_COLORS[player] }]}>
        <Text style={[styles.playerLabel, { color: PLAYER_COLORS[player] }]}>
          {room!.meta[player]?.name ?? PLAYER_LABELS[player]}
          {isLocal ? ' (You)' : ''}
        </Text>

        {/* VP */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>VP</Text>
          <Text style={[styles.statValue, { color: '#f39c12' }]}>{score.vp}</Text>
          {isLocal && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddVPFor(player)}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CP */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>CP</Text>
          <Text style={[styles.statValue, { color: '#2ecc71' }]}>{score.cp}</Text>
          {isLocal && (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity style={styles.smallBtn} onPress={() => spendCP(player)}>
                <Text style={styles.smallBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallBtn} onPress={() => gainCP(player)}>
                <Text style={styles.smallBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* VP Log */}
        <Text style={styles.logTitle}>VP Log</Text>
        <ScrollView style={styles.logScroll} nestedScrollEnabled>
          {[...log].reverse().map((entry, i) => (
            <Text key={i} style={styles.logEntry}>
              R{entry.round} +{entry.amount} — {entry.reason}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Score</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cols}>
            {renderPlayer('p1')}
            {renderPlayer('p2')}
          </View>
        </View>
      </View>

      {addVPFor && (
        <AddVPModal
          player={addVPFor}
          visible={true}
          onClose={() => setAddVPFor(null)}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    backgroundColor: '#16213e', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '70%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  closeBtn: { color: '#888', fontSize: 20 },
  cols: { flexDirection: 'row', gap: 12 },
  playerCol: {
    flex: 1, backgroundColor: '#0d1117', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#333',
  },
  playerLabel: { fontWeight: '800', fontSize: 14, marginBottom: 10 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  statLabel: { color: '#888', fontSize: 13, width: 28 },
  statValue: { fontSize: 28, fontWeight: '900', minWidth: 40 },
  addBtn: { backgroundColor: '#f39c12', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#1a1a2e', fontWeight: '900', fontSize: 18 },
  smallBtn: { backgroundColor: '#2c3e50', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  logTitle: { color: '#555', fontSize: 11, marginTop: 8, marginBottom: 4 },
  logScroll: { maxHeight: 100 },
  logEntry: { color: '#888', fontSize: 11, marginBottom: 3 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalBox: { backgroundColor: '#16213e', borderRadius: 16, padding: 24, width: '80%', maxWidth: 360 },
  modalTitle: { color: '#fff', fontWeight: '800', fontSize: 17, marginBottom: 16 },
  modalInput: {
    backgroundColor: '#0d1117', color: '#fff', borderRadius: 8, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#333', marginBottom: 10,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#2c3e50', alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: '700' },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#27ae60', alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});
