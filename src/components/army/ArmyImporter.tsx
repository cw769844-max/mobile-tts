import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parseRosFile } from '../../data/battlescribe-parser';
import { parsePlainText } from '../../data/plaintext-parser';
import { ArmyList, Datasheet } from '../../types/army';

// ---- DatasheetCard ----

function DatasheetCard({ sheet }: { sheet: Datasheet }) {
  const [expanded, setExpanded] = useState(false);
  const s = sheet.stats;
  const hasRealStats = s.T > 0 || s.W > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.unitName}>{sheet.name}</Text>
        <Text style={styles.unitMeta}>
          {sheet.modelCount > 1 ? `${sheet.modelCount}x · ` : ''}{sheet.pointsCost > 0 ? `${sheet.pointsCost}pts` : '—'}
        </Text>
      </View>

      {hasRealStats && (
        <View style={styles.statBar}>
          {(['M', 'T', 'Sv', 'W', 'Ld', 'OC'] as const).map((key) => (
            <View key={key} style={styles.statCell}>
              <Text style={styles.statKey}>{key}</Text>
              <Text style={styles.statVal}>
                {s[key]}{key === 'Sv' ? '+' : key === 'M' ? '"' : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

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

// ---- ArmyPreview ----

function ArmyPreview({
  army,
  onReset,
  onConfirm,
}: { army: ArmyList; onReset: () => void; onConfirm: () => void }) {
  const hasStatData = army.units.some((u) => u.stats.T > 0 || u.stats.W > 0);

  return (
    <>
      <View style={styles.armyInfo}>
        <Text style={styles.armyFaction}>{army.faction}</Text>
        {army.detachment ? <Text style={styles.armyDetachment}>{army.detachment}</Text> : null}
        <Text style={styles.armyPts}>{army.totalPoints} pts · {army.units.length} units</Text>
        {!hasStatData && (
          <Text style={styles.statNote}>
            Stat lines not available — edit each token after placing it on the board.
          </Text>
        )}
      </View>

      <ScrollView style={styles.unitList} showsVerticalScrollIndicator={false}>
        {army.units.map((u) => <DatasheetCard key={u.id} sheet={u} />)}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.rePickBtn} onPress={onReset}>
          <Text style={styles.rePickText}>Re-import</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.useBtn} onPress={onConfirm}>
          <Text style={styles.useBtnText}>Use This Army</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ---- Import methods ----

type ImportMethod = 'file' | 'paste';

// ---- Main ArmyImporter ----

interface ArmyImporterProps {
  visible: boolean;
  onClose: () => void;
  onImport?: (army: ArmyList) => void;
}

export function ArmyImporter({ visible, onClose, onImport }: ArmyImporterProps) {
  const [method, setMethod] = useState<ImportMethod>('file');
  const [loading, setLoading] = useState(false);
  const [army, setArmy] = useState<ArmyList | null>(null);
  const [pastedText, setPastedText] = useState('');

  function reset() {
    setArmy(null);
    setPastedText('');
  }

  // ---- File import (.ros / .rosz / .txt) ----
  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const name: string = asset.name ?? '';
    const lower = name.toLowerCase();

    setLoading(true);
    try {
      let parsed: ArmyList;
      if (lower.endsWith('.ros') || lower.endsWith('.rosz')) {
        parsed = await parseRosFile(asset.uri, true);
      } else if (lower.endsWith('.txt') || lower.endsWith('.text')) {
        const resp = await fetch(asset.uri);
        const text = await resp.text();
        parsed = parsePlainText(text);
      } else {
        // Unknown extension — try .ros first, fall back to plaintext
        try {
          parsed = await parseRosFile(asset.uri, true);
        } catch {
          const resp = await fetch(asset.uri);
          const text = await resp.text();
          parsed = parsePlainText(text);
        }
      }
      setArmy(parsed);
    } catch (e: any) {
      Alert.alert('Import Error', e.message ?? 'Could not read the army list.');
    } finally {
      setLoading(false);
    }
  }

  // ---- Paste import ----
  function parsePasted() {
    if (!pastedText.trim()) {
      Alert.alert('Nothing to parse', 'Paste your army list first.');
      return;
    }
    try {
      const parsed = parsePlainText(pastedText);
      setArmy(parsed);
    } catch (e: any) {
      Alert.alert('Parse Error', e.message ?? 'Could not read the pasted text.');
    }
  }

  function handleConfirm() {
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

          {army ? (
            <ArmyPreview army={army} onReset={reset} onConfirm={handleConfirm} />
          ) : (
            <>
              {/* Method tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, method === 'file' && styles.tabActive]}
                  onPress={() => setMethod('file')}
                >
                  <Text style={[styles.tabText, method === 'file' && styles.tabTextActive]}>
                    File
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, method === 'paste' && styles.tabActive]}
                  onPress={() => setMethod('paste')}
                >
                  <Text style={[styles.tabText, method === 'paste' && styles.tabTextActive]}>
                    Paste Text
                  </Text>
                </TouchableOpacity>
              </View>

              {method === 'file' ? (
                <View style={styles.importPrompt}>
                  <Text style={styles.promptText}>
                    Select your army file. Supported sources:
                  </Text>
                  <View style={styles.sourceList}>
                    <SourceRow icon="✓" label="New Recruit" note=".ros export" />
                    <SourceRow icon="✓" label="Battlescribe" note=".ros / .rosz export" />
                    <SourceRow icon="✓" label="Warscribe / Administratum" note=".ros export" />
                    <SourceRow icon="✓" label="Any BattleScribe-compatible app" note=".ros / .rosz" />
                    <SourceRow icon="✓" label="Plain text list" note=".txt file" />
                  </View>
                  <Text style={styles.howTo}>
                    New Recruit: Lists → Share → Export as BattleScribe
                  </Text>
                  <TouchableOpacity style={styles.pickBtn} onPress={pickFile} disabled={loading}>
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.pickBtnText}>Choose File (.ros / .rosz / .txt)</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pasteArea}>
                  <Text style={styles.promptText}>
                    Paste a plain-text army list — works with the official GW app text export,
                    ITC / BCP tournament format, or any freeform list with unit names and points.
                  </Text>
                  <TextInput
                    style={styles.pasteInput}
                    multiline
                    placeholder={'Paste your list here...\n\ne.g.:\nSpace Marines - 1000pts\n\nCaptain - 80pts\nIntercessor Squad - 100pts'}
                    placeholderTextColor="#444"
                    value={pastedText}
                    onChangeText={setPastedText}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity style={styles.pickBtn} onPress={parsePasted}>
                    <Text style={styles.pickBtnText}>Parse List</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function SourceRow({ icon, label, note }: { icon: string; label: string; note: string }) {
  return (
    <View style={styles.sourceRow}>
      <Text style={styles.sourceIcon}>{icon}</Text>
      <Text style={styles.sourceLabel}>{label}</Text>
      <Text style={styles.sourceNote}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    backgroundColor: '#16213e', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '92%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  closeBtn: { color: '#888', fontSize: 20 },

  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2c3e50', alignItems: 'center' },
  tabActive: { backgroundColor: '#c0392b' },
  tabText: { color: '#888', fontWeight: '700' },
  tabTextActive: { color: '#fff' },

  importPrompt: { alignItems: 'center' },
  promptText: { color: '#aaa', fontSize: 13, marginBottom: 12, lineHeight: 20 },
  sourceList: { alignSelf: 'stretch', backgroundColor: '#0d1117', borderRadius: 10, padding: 12, marginBottom: 12, gap: 6 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceIcon: { color: '#2ecc71', fontSize: 13, width: 16 },
  sourceLabel: { color: '#ddd', fontSize: 13, flex: 1 },
  sourceNote: { color: '#666', fontSize: 11 },
  howTo: { color: '#666', fontSize: 11, marginBottom: 16, textAlign: 'center', fontStyle: 'italic' },

  pickBtn: { backgroundColor: '#c0392b', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, alignSelf: 'stretch' },
  pickBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, textAlign: 'center' },

  pasteArea: { flex: 1 },
  pasteInput: {
    backgroundColor: '#0d1117', color: '#ddd', borderRadius: 10, padding: 14,
    fontSize: 13, borderWidth: 1, borderColor: '#333', minHeight: 180,
    marginVertical: 12, fontFamily: 'monospace',
  },

  // Army preview
  armyInfo: { backgroundColor: '#0d1117', borderRadius: 10, padding: 14, marginBottom: 12 },
  armyFaction: { color: '#f39c12', fontWeight: '900', fontSize: 18 },
  armyDetachment: { color: '#aaa', fontSize: 13, marginTop: 2 },
  armyPts: { color: '#888', fontSize: 12, marginTop: 4 },
  statNote: { color: '#e67e22', fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  unitList: { flex: 1 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rePickBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#2c3e50', alignItems: 'center' },
  rePickText: { color: '#aaa', fontWeight: '700' },
  useBtn: { flex: 2, padding: 12, borderRadius: 8, backgroundColor: '#27ae60', alignItems: 'center' },
  useBtnText: { color: '#fff', fontWeight: '700' },

  // Datasheet card
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
});
