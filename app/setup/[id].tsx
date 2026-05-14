import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, updateConfig } from '../../src/firebase/gameSync';
import { useGameStore } from '../../src/store/gameStore';
import { MissionType, DeploymentType, DEFAULT_CONFIG } from '../../src/types/game';
import { DEPLOYMENT_CONFIGS } from '../../src/data/deployment-configs';

const MISSIONS: MissionType[] = [
  'Abandoned Sanctum', 'Chilling Rain', 'Crucible of Battle', 'Decisive Action',
  'Linchpin', 'Matched Reserves', 'Scorched Earth', 'Seize and Hold', 'Swift Acquisition',
];

export default function SetupScreen() {
  const router = useRouter();
  const { id: gameId } = useLocalSearchParams<{ id: string }>();
  const { room, updateGameConfig } = useGameStore();

  const [mapUri, setMapUri] = useState<string | null>(null);
  const [mission, setMission] = useState<MissionType>('Seize and Hold');
  const [deployment, setDeployment] = useState<DeploymentType>('dawn-of-war');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [minutes, setMinutes] = useState(75);
  const [uploading, setUploading] = useState(false);

  async function pickMap() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMapUri(result.assets[0].uri);
    }
  }

  async function startGame() {
    if (!gameId) return;
    setUploading(true);
    try {
      let mapImageUrl = room?.config.mapImageUrl ?? null;
      if (mapUri) {
        mapImageUrl = await uploadImage(mapUri, `games/${gameId}/map.jpg`);
      }
      await updateGameConfig({
        mapImageUrl,
        missionType: mission,
        deploymentType: deployment,
        timerEnabled,
        minutesPerPlayer: minutes,
      });
      router.replace(`/lobby/${gameId}?role=host`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Game Setup</Text>

      {/* Map */}
      <Text style={styles.sectionLabel}>Battle Map</Text>
      <TouchableOpacity style={styles.mapPicker} onPress={pickMap}>
        <Text style={styles.mapPickerText}>
          {mapUri ? '✓ Map selected — tap to change' : '+ Import Battle Map Image'}
        </Text>
      </TouchableOpacity>

      {/* Mission */}
      <Text style={styles.sectionLabel}>Primary Mission</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
        {MISSIONS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.chip, mission === m && styles.chipActive]}
            onPress={() => setMission(m)}
          >
            <Text style={[styles.chipText, mission === m && styles.chipTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Deployment */}
      <Text style={styles.sectionLabel}>Deployment</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
        {DEPLOYMENT_CONFIGS.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={[styles.chip, deployment === d.id && styles.chipActive]}
            onPress={() => setDeployment(d.id as DeploymentType)}
          >
            <Text style={[styles.chipText, deployment === d.id && styles.chipTextActive]}>{d.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Timer */}
      <Text style={styles.sectionLabel}>Turn Timer</Text>
      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>Enable timer</Text>
        <Switch value={timerEnabled} onValueChange={setTimerEnabled} />
      </View>
      {timerEnabled && (
        <View style={styles.minutesRow}>
          <TouchableOpacity style={styles.minuteBtn} onPress={() => setMinutes(Math.max(10, minutes - 5))}>
            <Text style={styles.minuteBtnText}>−5</Text>
          </TouchableOpacity>
          <Text style={styles.minutesValue}>{minutes} min/player</Text>
          <TouchableOpacity style={styles.minuteBtn} onPress={() => setMinutes(Math.min(120, minutes + 5))}>
            <Text style={styles.minuteBtnText}>+5</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.startBtn} onPress={startGame} disabled={uploading}>
        {uploading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.startBtnText}>Save & Continue to Lobby</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 24 },
  sectionLabel: { color: '#888', fontWeight: '700', fontSize: 12, letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  mapPicker: {
    backgroundColor: '#16213e', borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: '#c0392b', borderStyle: 'dashed',
    alignItems: 'center',
  },
  mapPickerText: { color: '#c0392b', fontWeight: '700' },
  hScroll: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: '#2c3e50',
  },
  chipActive: { backgroundColor: '#c0392b' },
  chipText: { color: '#aaa', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timerLabel: { color: '#ccc', fontSize: 15 },
  minutesRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 },
  minuteBtn: { backgroundColor: '#2c3e50', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  minuteBtnText: { color: '#fff', fontWeight: '700' },
  minutesValue: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  startBtn: {
    backgroundColor: '#27ae60', paddingVertical: 18, borderRadius: 12,
    alignItems: 'center', marginTop: 32,
  },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
});
