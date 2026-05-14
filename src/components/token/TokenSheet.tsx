import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput,
  ScrollView, Switch,
} from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { Token, UnitStats, DEFAULT_STATS } from '../../types/game';
import { WoundTracker } from './WoundTracker';

const STAT_KEYS: (keyof UnitStats)[] = ['M', 'T', 'Sv', 'W', 'Ld', 'OC', 'BS', 'WS'];

interface StatInputProps {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  suffix?: string;
}

function StatInput({ label, value, onChange, suffix }: StatInputProps) {
  return (
    <View style={styles.statInput}>
      <Text style={styles.statLabel}>{label}</Text>
      <TextInput
        style={styles.statField}
        value={value !== null ? String(value) : '—'}
        onChangeText={(t) => {
          const n = parseInt(t, 10);
          onChange(isNaN(n) ? null : n);
        }}
        keyboardType="number-pad"
        selectTextOnFocus
      />
      {suffix && <Text style={styles.statSuffix}>{suffix}</Text>}
    </View>
  );
}

interface TokenSheetProps {
  tokenId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function TokenSheet({ tokenId, visible, onClose }: TokenSheetProps) {
  const room = useGameStore((s) => s.room);
  const { editToken, deleteToken, localPlayer } = useGameStore();

  const token = tokenId ? room?.tokens[tokenId] : null;

  const [name, setName] = useState('');
  const [stats, setStats] = useState<UnitStats>(DEFAULT_STATS);
  const [wounds, setWounds] = useState(1);
  const [battleShocked, setBattleShocked] = useState(false);
  const [inReserve, setInReserve] = useState(false);

  useEffect(() => {
    if (token) {
      setName(token.name);
      setStats(token.stats);
      setWounds(token.woundsRemaining);
      setBattleShocked(token.status.battleShocked);
      setInReserve(token.status.inReserve);
    }
  }, [tokenId, token]);

  if (!token) return null;

  const isOwner = token.ownerId === localPlayer;

  function updateStat(key: keyof UnitStats, val: number | null) {
    if (val === null) return;
    setStats((prev) => ({ ...prev, [key]: val }));
  }

  async function save() {
    if (!tokenId) return;
    await editToken(tokenId, {
      name,
      stats,
      woundsRemaining: wounds,
      status: { ...token!.status, battleShocked, inReserve },
    });
    onClose();
  }

  async function handleDelete() {
    if (!tokenId) return;
    await deleteToken(tokenId);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {isOwner ? 'Edit Token' : 'View Token'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              editable={isOwner}
              placeholder="Unit name"
              placeholderTextColor="#555"
            />

            {/* Wounds */}
            <Text style={styles.fieldLabel}>Wounds ({wounds}/{stats.W})</Text>
            <WoundTracker
              current={wounds}
              max={stats.W}
              onChange={setWounds}
            />

            {/* Stats grid */}
            <Text style={styles.fieldLabel}>Stats</Text>
            <View style={styles.statsGrid}>
              {STAT_KEYS.map((k) => (
                <StatInput
                  key={k}
                  label={k}
                  value={stats[k] as number}
                  onChange={(v) => updateStat(k, v)}
                  suffix={['Sv', 'BS', 'WS'].includes(k) ? '+' : '"'}
                />
              ))}
              <StatInput
                label="Invuln"
                value={stats.invulSv}
                onChange={(v) => setStats((p) => ({ ...p, invulSv: v }))}
                suffix="+"
              />
            </View>

            {/* Status flags */}
            {isOwner && (
              <>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Battle-shocked</Text>
                  <Switch
                    value={battleShocked}
                    onValueChange={setBattleShocked}
                    trackColor={{ true: '#8e44ad' }}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>In Reserve</Text>
                  <Switch
                    value={inReserve}
                    onValueChange={setInReserve}
                    trackColor={{ true: '#2980b9' }}
                  />
                </View>
              </>
            )}
          </ScrollView>

          {isOwner && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: {
    backgroundColor: '#16213e', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1 },
  closeBtn: { color: '#888', fontSize: 20 },
  fieldLabel: { color: '#888', fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6, letterSpacing: 1 },
  nameInput: {
    backgroundColor: '#0d1117', color: '#fff', borderRadius: 8, padding: 12,
    fontSize: 16, borderWidth: 1, borderColor: '#333', marginBottom: 8,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statInput: {
    backgroundColor: '#0d1117', borderRadius: 8, padding: 10, alignItems: 'center',
    width: '22%', borderWidth: 1, borderColor: '#333',
  },
  statLabel: { color: '#888', fontSize: 10, fontWeight: '700' },
  statField: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center', width: '100%' },
  statSuffix: { color: '#555', fontSize: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  switchLabel: { color: '#ccc', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  deleteBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#641e16', alignItems: 'center' },
  deleteBtnText: { color: '#e74c3c', fontWeight: '700' },
  saveBtn: { flex: 2, padding: 14, borderRadius: 8, backgroundColor: '#27ae60', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
