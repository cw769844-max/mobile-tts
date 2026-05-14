import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parseRosFile } from '../../data/battlescribe-parser';
import { ArmyList, Datasheet } from '../../types/army';

interface DatasheetCardProps {
  sheet: Datasheet;
}

function DatasheetCard({ sheet }: DatasheetCardProps) {
  const [expanded, setExpanded] = useState(false);
  const stats = sheet.stats;

  return (
    <TouchableOpacity style={styles.card} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.unitName}>{sheet.name}</Text>
        <Text style={styles.unitMeta}>{sheet.modelCount} model{sheet.modelCount !== 1 ? 's' : ''} · {sheet.pointsCost}pts</Text>
      </View>

      {/* Stat bar */}
      <View style={styles.statBar}>
        {(['M', 'T', 'Sv', 'W', 'Ld', 'OC'] as const).map((key) => (
          <View key={key} style={styles.statCell}>
            <Text style={styles.statKey}>{key}</Text>
            <Text style={styles.statVal}>
              {stats[key]}{['Sv'].includes(key) ? '+' : key === 'M' ? '"' : ''}
            </Text>
          </View>
        ))}
      </View>

      {expanded && sheet.weapons.length > 0 && (
        <View style={styles.weapons}>
          <Text style={styles.weaponsTitle}>Weapons</Text>
          {sheet.weapons.map((w, i) => (
            <View key={i} style={styles.weaponRow}>
              <Text style={styles.weaponName}>{w.name}</Text>
              <Text style={styles.weaponStats}>
                {w.range} · A{w.attacks} · BS{w.bs} · S{w.strength} · AP{w.ap} · D{w.damage}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

interface ArmyImporterProps {
  visible: boolean;
  onClose: () => void;
  onImport?: (army: ArmyList) => void;
}

export function ArmyImporter({ visible, onClose, onImport }: ArmyImporterProps) {
  const [loading, setLoading] = useState(false);
  const [army, setArmy] = useState<ArmyList | null>(null);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const name: string = asset.name ?? '';
    const isRosz = name.endsWith('.rosz');
    const isRos = name.endsWith('.ros');

    if (!isRos && !isRosz) {
      Alert.alert('Unsupported file', 'Please select a Battlescribe .ros or .rosz file.');
      return;
    }

    setLoading(true);
    try {
      const parsed = await parseRosFile(asset.uri, true);
      setArmy(parsed);
    } catch (e: any) {
      Alert.alert('Parse Error', e.message ?? 'Could not read the army list file.');
    } finally {
      setLoading(false);
    }
  }

  function handleImport() {
    if (army && onImport) {
      onImport(army);
      onClose();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Import Army List</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {!army ? (
            <View style={styles.importPrompt}>
              <Text style={styles.promptText}>
                Import your army from Battlescribe (.ros or .rosz file).{'\n\n'}
                Export your list in Battlescribe → Share → Export as Battlescribe.
              </Text>
              <TouchableOpacity style={styles.pickBtn} onPress={pickFile} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.pickBtnText}>Select Army File</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.armyInfo}>
                <Text style={styles.armyFaction}>{army.faction}</Text>
                {army.detachment ? <Text style={styles.armyDetachment}>{army.detachment}</Text> : null}
                <Text style={styles.armyPts}>{army.totalPoints} pts · {army.units.length} units</Text>
              </View>

              <ScrollView style={styles.unitList} showsVerticalScrollIndicator={false}>
                {army.units.map((u) => (
                  <DatasheetCard key={u.id} sheet={u} />
                ))}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.rePickBtn} onPress={() => { setArmy(null); pickFile(); }}>
                  <Text style={styles.rePickText}>Re-import</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.useBtn} onPress={handleImport}>
                  <Text style={styles.useBtnText}>Use This Army</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    backgroundColor: '#16213e', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  closeBtn: { color: '#888', fontSize: 20 },
  importPrompt: { alignItems: 'center', paddingVertical: 32 },
  promptText: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  pickBtn: { backgroundColor: '#c0392b', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 10 },
  pickBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  armyInfo: { backgroundColor: '#0d1117', borderRadius: 10, padding: 14, marginBottom: 12 },
  armyFaction: { color: '#f39c12', fontWeight: '900', fontSize: 18 },
  armyDetachment: { color: '#aaa', fontSize: 13, marginTop: 2 },
  armyPts: { color: '#888', fontSize: 12, marginTop: 4 },
  unitList: { flex: 1 },
  card: { backgroundColor: '#0d1117', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  unitName: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
  unitMeta: { color: '#888', fontSize: 11 },
  statBar: { flexDirection: 'row', gap: 6 },
  statCell: { flex: 1, alignItems: 'center', backgroundColor: '#16213e', borderRadius: 6, padding: 4 },
  statKey: { color: '#888', fontSize: 9, fontWeight: '700' },
  statVal: { color: '#fff', fontSize: 14, fontWeight: '900' },
  weapons: { marginTop: 10 },
  weaponsTitle: { color: '#888', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  weaponRow: { marginBottom: 4 },
  weaponName: { color: '#ddd', fontSize: 12, fontWeight: '700' },
  weaponStats: { color: '#888', fontSize: 11 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rePickBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#2c3e50', alignItems: 'center' },
  rePickText: { color: '#aaa', fontWeight: '700' },
  useBtn: { flex: 2, padding: 12, borderRadius: 8, backgroundColor: '#27ae60', alignItems: 'center' },
  useBtnText: { color: '#fff', fontWeight: '700' },
});
