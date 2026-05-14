import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
  TextInput, Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { rollDice } from '../../game/dice';
import { resolveCombat } from '../../game/combat';
import {
  DieType, DiceRollResult, CombatInput, CombatResult, DEFAULT_COMBAT_INPUT,
} from '../../types/game';

// ---- Simple Roll Tab ----

function SimpleRollTab() {
  const [dieType, setDieType] = useState<DieType>('D6');
  const [count, setCount] = useState(1);
  const [result, setResult] = useState<DiceRollResult | null>(null);

  function roll() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setResult(rollDice(dieType, count));
  }

  const DIE_TYPES: DieType[] = ['D2', 'D3', 'D6', '2D6'];

  return (
    <View style={styles.tabContent}>
      <View style={styles.dieSelector}>
        {DIE_TYPES.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.dieChip, dieType === d && styles.dieChipActive]}
            onPress={() => setDieType(d)}
          >
            <Text style={[styles.dieChipText, dieType === d && styles.dieChipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {dieType === 'D6' && (
        <View style={styles.countRow}>
          <TouchableOpacity style={styles.countBtn} onPress={() => setCount(Math.max(1, count - 1))}>
            <Text style={styles.countBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.countValue}>{count}× {dieType}</Text>
          <TouchableOpacity style={styles.countBtn} onPress={() => setCount(Math.min(20, count + 1))}>
            <Text style={styles.countBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.rollBtn} onPress={roll}>
        <Text style={styles.rollBtnText}>ROLL</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultBox}>
          <View style={styles.diceRow}>
            {result.results.map((v, i) => (
              <View key={i} style={styles.dieface}>
                <Text style={styles.diefaceText}>{v}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.totalText}>Total: {result.total}</Text>
        </View>
      )}
    </View>
  );
}

// ---- Combat Wizard Tab ----

function NumInput({ label, value, onChange, min = 0, max = 99 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <View style={styles.numRow}>
      <Text style={styles.numLabel}>{label}</Text>
      <TouchableOpacity style={styles.numBtn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={styles.numBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.numValue}>{value}</Text>
      <TouchableOpacity style={styles.numBtn} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={styles.numBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function CombatWizardTab() {
  const [input, setInput] = useState<CombatInput>(DEFAULT_COMBAT_INPUT);
  const [result, setResult] = useState<CombatResult | null>(null);

  function update(partial: Partial<CombatInput>) {
    setInput((prev) => ({ ...prev, ...partial }));
  }

  function roll() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setResult(resolveCombat(input));
  }

  const rerollOpts = ['none', 'ones', 'all'] as const;

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.section}>Attacker</Text>
      <NumInput label="Attacks" value={input.attacks} onChange={(v) => update({ attacks: v })} min={1} max={40} />
      <NumInput label="Skill (N+)" value={input.skill} onChange={(v) => update({ skill: v })} min={2} max={6} />
      <NumInput label="Strength" value={input.strength} onChange={(v) => update({ strength: v })} min={1} max={24} />
      <NumInput label="AP" value={input.ap} onChange={(v) => update({ ap: v })} min={0} max={6} />
      <NumInput label="Damage" value={input.damage} onChange={(v) => update({ damage: v })} min={1} max={20} />
      <NumInput label="Sustained Hits" value={input.sustainedHits} onChange={(v) => update({ sustainedHits: v })} min={0} max={6} />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Lethal Hits</Text>
        <Switch value={input.lethalHits} onValueChange={(v) => update({ lethalHits: v })} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Devastating Wounds</Text>
        <Switch value={input.devastatingWounds} onValueChange={(v) => update({ devastatingWounds: v })} />
      </View>

      <Text style={styles.section}>Defender</Text>
      <NumInput label="Toughness" value={input.targetT} onChange={(v) => update({ targetT: v })} min={1} max={16} />
      <NumInput label="Save (N+)" value={input.targetSv} onChange={(v) => update({ targetSv: v })} min={2} max={7} />
      <NumInput
        label="Invuln (N+)"
        value={input.targetInvul ?? 7}
        onChange={(v) => update({ targetInvul: v >= 7 ? null : v })}
        min={2} max={7}
      />
      {input.targetInvul !== null && (
        <Text style={styles.hint}>Invuln active: {input.targetInvul}+</Text>
      )}

      <Text style={styles.section}>Re-rolls</Text>
      <View style={styles.rerollRow}>
        <Text style={styles.numLabel}>Hits:</Text>
        {rerollOpts.map((o) => (
          <TouchableOpacity
            key={o}
            style={[styles.rerollChip, input.rerollHits === o && styles.rerollChipActive]}
            onPress={() => update({ rerollHits: o })}
          >
            <Text style={styles.rerollChipText}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.rerollRow}>
        <Text style={styles.numLabel}>Wounds:</Text>
        {rerollOpts.map((o) => (
          <TouchableOpacity
            key={o}
            style={[styles.rerollChip, input.rerollWounds === o && styles.rerollChipActive]}
            onPress={() => update({ rerollWounds: o })}
          >
            <Text style={styles.rerollChipText}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.rollBtn, { marginTop: 16 }]} onPress={roll}>
        <Text style={styles.rollBtnText}>RESOLVE COMBAT</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.combatResult}>
          <CombatStep label={result.hitStep.label} rolls={result.hitStep.rolls} threshold={input.skill} />
          <CombatStep label={result.woundStep.label} rolls={result.woundStep.rolls} threshold={undefined} />
          <CombatStep label={result.saveStep.label} rolls={result.saveStep.rolls} threshold={undefined} />
          {result.mortals > 0 && (
            <Text style={styles.mortalText}>+{result.mortals} mortal wound{result.mortals !== 1 ? 's' : ''} (Devastating)</Text>
          )}
          <Text style={styles.damageTotal}>Total Damage: {result.totalDamage}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function CombatStep({ label, rolls, threshold }: { label: string; rolls: number[]; threshold?: number }) {
  return (
    <View style={styles.stepBox}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.diceRow}>
        {rolls.map((v, i) => (
          <View key={i} style={[styles.dieface, styles.diefaceSmall]}>
            <Text style={styles.diefaceTextSmall}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---- Main DiceRoller ----

interface DiceRollerProps {
  visible: boolean;
  onClose: () => void;
}

export function DiceRoller({ visible, onClose }: DiceRollerProps) {
  const [tab, setTab] = useState<'simple' | 'combat'>('simple');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Dice Roller</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {(['simple', 'combat'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                  {t === 'simple' ? 'Simple Roll' : 'Combat Wizard'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'simple' ? <SimpleRollTab /> : <CombatWizardTab />}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  closeBtn: { color: '#888', fontSize: 20 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2c3e50', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#c0392b' },
  tabBtnText: { color: '#888', fontWeight: '700' },
  tabBtnTextActive: { color: '#fff' },
  tabContent: { flex: 1 },
  dieSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  dieChip: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2c3e50', alignItems: 'center' },
  dieChipActive: { backgroundColor: '#c0392b' },
  dieChipText: { color: '#888', fontWeight: '700', fontSize: 16 },
  dieChipTextActive: { color: '#fff' },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 },
  countBtn: { backgroundColor: '#2c3e50', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  countBtnText: { color: '#fff', fontSize: 20 },
  countValue: { color: '#fff', fontSize: 20, fontWeight: '700', minWidth: 80, textAlign: 'center' },
  rollBtn: { backgroundColor: '#c0392b', paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  rollBtnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  resultBox: { marginTop: 20, alignItems: 'center' },
  diceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginVertical: 8 },
  dieface: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: '#f39c12',
    justifyContent: 'center', alignItems: 'center',
  },
  diefaceText: { fontSize: 22, fontWeight: '900', color: '#1a1a2e' },
  diefaceSmall: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#2c3e50' },
  diefaceTextSmall: { fontSize: 14, fontWeight: '700', color: '#fff' },
  totalText: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 },
  section: { color: '#888', fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6, letterSpacing: 1 },
  numRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  numLabel: { color: '#aaa', fontSize: 13, flex: 1 },
  numBtn: { backgroundColor: '#2c3e50', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  numBtnText: { color: '#fff', fontSize: 18 },
  numValue: { color: '#fff', fontSize: 18, fontWeight: '700', width: 32, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  toggleLabel: { color: '#aaa', fontSize: 13, flex: 1 },
  hint: { color: '#2ecc71', fontSize: 12, marginBottom: 4 },
  rerollRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  rerollChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#2c3e50' },
  rerollChipActive: { backgroundColor: '#8e44ad' },
  rerollChipText: { color: '#ccc', fontSize: 12 },
  combatResult: { marginTop: 16, backgroundColor: '#0d1117', borderRadius: 10, padding: 12 },
  stepBox: { marginBottom: 10 },
  stepLabel: { color: '#2ecc71', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  mortalText: { color: '#e74c3c', fontSize: 13, marginTop: 4 },
  damageTotal: { color: '#f39c12', fontWeight: '900', fontSize: 22, marginTop: 8, textAlign: 'center' },
});
