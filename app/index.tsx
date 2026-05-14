import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createGame, joinGame } from '../src/firebase/gameSync';
import { useGameStore } from '../src/store/gameStore';

export default function HomeScreen() {
  const router = useRouter();
  const setGameId = useGameStore((s) => s.setGameId);

  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);

  async function handleCreate() {
    if (!name.trim()) return Alert.alert('Enter your name first');
    setLoading('create');
    try {
      const { gameId, code } = await createGame(name.trim());
      setGameId(gameId, 'p1');
      router.push(`/lobby/${gameId}?role=host&code=${code}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleJoin() {
    if (!name.trim()) return Alert.alert('Enter your name first');
    if (!joinCode.trim()) return Alert.alert('Enter an invite code');
    setLoading('join');
    try {
      const gameId = await joinGame(joinCode.trim(), name.trim());
      setGameId(gameId, 'p2');
      router.push(`/lobby/${gameId}?role=guest`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WH40K Tabletop</Text>
      <Text style={styles.subtitle}>10th Edition Simulator</Text>

      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor="#666"
        value={name}
        onChangeText={setName}
        maxLength={20}
      />

      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary]}
        onPress={handleCreate}
        disabled={loading !== null}
      >
        {loading === 'create'
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Create Game</Text>}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR JOIN</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Invite code (e.g. AB12CD)"
        placeholderTextColor="#666"
        value={joinCode}
        onChangeText={(t) => setJoinCode(t.toUpperCase())}
        autoCapitalize="characters"
        maxLength={6}
      />

      <TouchableOpacity
        style={[styles.btn, styles.btnSecondary]}
        onPress={handleJoin}
        disabled={loading !== null}
      >
        {loading === 'join'
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Join Game</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center',
    alignItems: 'center', padding: 32,
  },
  title: { fontSize: 36, fontWeight: '900', color: '#c0392b', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 40, letterSpacing: 1 },
  input: {
    width: '100%', maxWidth: 340, backgroundColor: '#16213e', color: '#fff',
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, borderWidth: 1, borderColor: '#333', marginBottom: 12,
  },
  btn: {
    width: '100%', maxWidth: 340, paddingVertical: 14, borderRadius: 8,
    alignItems: 'center', marginBottom: 12,
  },
  btnPrimary: { backgroundColor: '#c0392b' },
  btnSecondary: { backgroundColor: '#2c3e50' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 340, marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#333' },
  dividerText: { color: '#555', paddingHorizontal: 12, fontSize: 12 },
});
