import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert,
} from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { PlayerId } from '../../types/game';
import { SecondaryCard, DrawnCard } from '../../types/mission';
import TACTICAL_CARDS from '../../data/tactical-secondaries.json';

function VpPips({ current, max }: { current: number; max: number }) {
  return (
    <View style={styles.pips}>
      {Array.from({ length: Math.min(max, 4) }).map((_, i) => (
        <View
          key={i}
          style={[styles.pip, i < current && styles.pipFilled]}
        />
      ))}
      {max > 4 && <Text style={styles.pipMore}>+{max - 4}</Text>}
    </View>
  );
}

interface CardDisplayProps {
  card: SecondaryCard;
  drawn: DrawnCard;
  isOwner: boolean;
  onScore: (amount: number) => void;
}

function CardDisplay({ card, drawn, isOwner, onScore }: CardDisplayProps) {
  return (
    <View style={styles.cardBox}>
      <Text style={styles.cardName}>{card.name}</Text>
      <Text style={styles.cardDesc} numberOfLines={3}>{card.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardVp}>{drawn.currentVp}/{drawn.maxVp} VP</Text>
        <VpPips current={drawn.currentVp} max={drawn.maxVp} />
        {isOwner && (
          <View style={styles.scoreButtons}>
            {[1, 2, 3, 4].filter((n) => drawn.currentVp + n <= drawn.maxVp).map((n) => (
              <TouchableOpacity key={n} style={styles.scoreBtn} onPress={() => onScore(n)}>
                <Text style={styles.scoreBtnText}>+{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

interface MissionPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function MissionPanel({ visible, onClose }: MissionPanelProps) {
  const room = useGameStore((s) => s.room);
  const localPlayer = useGameStore((s) => s.localPlayer);
  const addVP = useGameStore((s) => s.addVP);
  const [tab, setTab] = useState<'mine' | 'opponent'>('mine');

  if (!room || !localPlayer) return null;

  const opponentPlayer: PlayerId = localPlayer === 'p1' ? 'p2' : 'p1';

  const cardsById = new Map<string, SecondaryCard>(
    (TACTICAL_CARDS as SecondaryCard[]).map((c) => [c.id, c]),
  );

  async function scoreCard(cardId: string, amount: number, player: PlayerId) {
    const card = cardsById.get(cardId);
    if (!card) return;
    await addVP(player, amount, `Secondary: ${card.name}`);
  }

  function renderPlayerCards(player: PlayerId, isOwner: boolean) {
    const score = room!.scores[player];
    const playerName = player === 'p1' ? room!.meta.p1.name : room!.meta.p2?.name ?? 'Player 2';
    const drawnCards: DrawnCard[] = [];

    return (
      <View>
        <Text style={styles.playerLabel}>{playerName}</Text>
        {drawnCards.length === 0 && (
          <Text style={styles.emptyText}>No secondary missions drawn yet.</Text>
        )}
        {drawnCards.map((drawn) => {
          const card = cardsById.get(drawn.cardId);
          if (!card) return null;
          return (
            <CardDisplay
              key={drawn.cardId}
              card={card}
              drawn={drawn}
              isOwner={isOwner}
              onScore={(n) => scoreCard(drawn.cardId, n, player)}
            />
          );
        })}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Missions</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.missionInfo}>
            <Text style={styles.missionName}>{room.config.missionType}</Text>
            <Text style={styles.missionSub}>Primary mission — Round {room.state.round}/5</Text>
          </View>

          <View style={styles.tabs}>
            {(['mine', 'opponent'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === 'mine' ? 'My Secondaries' : 'Opponent\'s'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.content}>
            {tab === 'mine'
              ? renderPlayerCards(localPlayer, true)
              : renderPlayerCards(opponentPlayer, false)}
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
    padding: 20, maxHeight: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  closeBtn: { color: '#888', fontSize: 20 },
  missionInfo: { backgroundColor: '#0d1117', borderRadius: 10, padding: 14, marginBottom: 12 },
  missionName: { color: '#f39c12', fontWeight: '800', fontSize: 16 },
  missionSub: { color: '#888', fontSize: 13, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2c3e50', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#c0392b' },
  tabText: { color: '#888', fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1 },
  playerLabel: { color: '#888', fontWeight: '700', fontSize: 12, marginBottom: 8 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 20 },
  cardBox: {
    backgroundColor: '#0d1117', borderRadius: 10, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#333',
  },
  cardName: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  cardDesc: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  cardFooter: { gap: 8 },
  cardVp: { color: '#f39c12', fontWeight: '900', fontSize: 16 },
  pips: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  pip: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2c3e50', borderWidth: 1, borderColor: '#555' },
  pipFilled: { backgroundColor: '#f39c12', borderColor: '#f39c12' },
  pipMore: { color: '#888', fontSize: 11 },
  scoreButtons: { flexDirection: 'row', gap: 6 },
  scoreBtn: { backgroundColor: '#27ae60', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  scoreBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
