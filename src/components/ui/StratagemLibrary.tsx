import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
  TextInput, Alert,
} from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { Stratagem } from '../../types/stratagem';
import { GamePhase } from '../../types/game';
import { useStratagem } from '../../game/stratagems';
import CORE_STRATAGEMS_DATA from '../../data/core-stratagems.json';

const CORE_STRATAGEMS: Stratagem[] = CORE_STRATAGEMS_DATA.map((s) => ({
  ...s,
  cost: s.cost as 1 | 2 | 3,
  phase: s.phase as GamePhase | 'any',
}));

const PHASE_LABELS: Record<GamePhase | 'any', string> = {
  command: 'Command', movement: 'Movement', shooting: 'Shooting',
  charge: 'Charge', fight: 'Fight', any: 'Any',
};

const CP_COLORS: Record<number, string> = { 1: '#2ecc71', 2: '#f39c12', 3: '#e74c3c' };

interface StratagemCardProps {
  stratagem: Stratagem;
  onUse: () => void;
  canUse: boolean;
}

function StratagemCard({ stratagem, onUse, canUse }: StratagemCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={styles.card} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.cpBadge, { backgroundColor: CP_COLORS[stratagem.cost] }]}>
          <Text style={styles.cpText}>{stratagem.cost}CP</Text>
        </View>
        <Text style={styles.cardName}>{stratagem.name}</Text>
        <Text style={styles.phaseTag}>{PHASE_LABELS[stratagem.phase]}</Text>
      </View>
      {expanded && (
        <>
          <Text style={styles.timing}>{stratagem.timing}</Text>
          <Text style={styles.effect}>{stratagem.effect}</Text>
          {canUse && (
            <TouchableOpacity style={styles.useBtn} onPress={onUse}>
              <Text style={styles.useBtnText}>Use ({stratagem.cost}CP)</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

interface StratagemLibraryProps {
  visible: boolean;
  onClose: () => void;
}

export function StratagemLibrary({ visible, onClose }: StratagemLibraryProps) {
  const room = useGameStore((s) => s.room);
  const localPlayer = useGameStore((s) => s.localPlayer);
  const gameId = useGameStore((s) => s.gameId);
  const [phaseFilter, setPhaseFilter] = useState<GamePhase | 'any'>('any');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStrat, setNewStrat] = useState({ name: '', cost: '1', phase: 'any', timing: '', effect: '' });

  if (!room || !localPlayer || !gameId) return null;

  const currentPhase = room.state.phase;
  const myCP = room.scores[localPlayer].cp;

  const allStratagems = CORE_STRATAGEMS;

  const filtered = allStratagems.filter((s) =>
    phaseFilter === 'any' || s.phase === 'any' || s.phase === phaseFilter,
  );

  async function handleUse(stratagem: Stratagem) {
    if (myCP < stratagem.cost) {
      Alert.alert('Not enough CP', `You need ${stratagem.cost}CP but only have ${myCP}CP.`);
      return;
    }
    Alert.alert(
      `Use ${stratagem.name}?`,
      `This will cost ${stratagem.cost}CP (you have ${myCP}CP).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use',
          style: 'default',
          onPress: () => gameId && room && localPlayer && useStratagem(gameId, localPlayer, stratagem, room.state.round, currentPhase),
        },
      ],
    );
  }

  const PHASES: (GamePhase | 'any')[] = ['any', 'command', 'movement', 'shooting', 'charge', 'fight'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Stratagems</Text>
            <View style={styles.cpDisplay}>
              <Text style={styles.cpLabel}>Your CP:</Text>
              <Text style={styles.cpValue}>{myCP}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Phase filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {PHASES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.filterChip, phaseFilter === p && styles.filterChipActive]}
                onPress={() => setPhaseFilter(p)}
              >
                <Text style={[styles.filterChipText, phaseFilter === p && styles.filterChipTextActive]}>
                  {PHASE_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {filtered.map((s) => (
              <StratagemCard
                key={s.id}
                stratagem={s}
                canUse={myCP >= s.cost}
                onUse={() => handleUse(s)}
              />
            ))}
            <TouchableOpacity style={styles.addCustomBtn} onPress={() => setShowAddForm(!showAddForm)}>
              <Text style={styles.addCustomText}>+ Add Custom Stratagem</Text>
            </TouchableOpacity>
            {showAddForm && (
              <View style={styles.addForm}>
                <TextInput style={styles.formInput} placeholder="Name" placeholderTextColor="#555" value={newStrat.name} onChangeText={(t) => setNewStrat((p) => ({ ...p, name: t }))} />
                <TextInput style={styles.formInput} placeholder="Cost (1-3 CP)" placeholderTextColor="#555" keyboardType="number-pad" value={newStrat.cost} onChangeText={(t) => setNewStrat((p) => ({ ...p, cost: t }))} />
                <TextInput style={styles.formInput} placeholder="Timing" placeholderTextColor="#555" value={newStrat.timing} onChangeText={(t) => setNewStrat((p) => ({ ...p, timing: t }))} />
                <TextInput style={[styles.formInput, { height: 80 }]} placeholder="Effect" placeholderTextColor="#555" multiline value={newStrat.effect} onChangeText={(t) => setNewStrat((p) => ({ ...p, effect: t }))} />
                <Text style={styles.hint}>Custom stratagems are saved locally for reference only.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    backgroundColor: '#16213e', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '85%',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', flex: 1 },
  cpDisplay: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cpLabel: { color: '#888', fontSize: 13 },
  cpValue: { color: '#2ecc71', fontSize: 18, fontWeight: '900' },
  closeBtn: { color: '#888', fontSize: 20 },
  filterRow: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#2c3e50', marginRight: 6 },
  filterChipActive: { backgroundColor: '#8e44ad' },
  filterChipText: { color: '#aaa', fontSize: 12 },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },
  list: { flex: 1 },
  card: { backgroundColor: '#0d1117', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cpText: { color: '#1a1a2e', fontWeight: '900', fontSize: 12 },
  cardName: { color: '#fff', fontWeight: '700', flex: 1 },
  phaseTag: { color: '#888', fontSize: 11 },
  timing: { color: '#aaa', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  effect: { color: '#ddd', fontSize: 13, marginTop: 6 },
  useBtn: { backgroundColor: '#8e44ad', paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  useBtnText: { color: '#fff', fontWeight: '700' },
  addCustomBtn: { paddingVertical: 14, alignItems: 'center' },
  addCustomText: { color: '#8e44ad', fontWeight: '700' },
  addForm: { backgroundColor: '#0d1117', borderRadius: 10, padding: 12 },
  formInput: {
    backgroundColor: '#16213e', color: '#fff', borderRadius: 8, padding: 10,
    fontSize: 14, borderWidth: 1, borderColor: '#333', marginBottom: 8,
  },
  hint: { color: '#555', fontSize: 11, marginTop: 4 },
});
