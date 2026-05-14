import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface WoundTrackerProps {
  current: number;
  max: number;
  onChange: (newVal: number) => void;
}

export function WoundTracker({ current, max, onChange }: WoundTrackerProps) {
  const showPips = max <= 10;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(Math.max(0, current - 1))}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>

      {showPips ? (
        <View style={styles.pips}>
          {Array.from({ length: max }).map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onChange(i < current ? i : i + 1)}
            >
              <View style={[styles.pip, i < current ? styles.pipFilled : styles.pipEmpty]} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.counter}>{current}/{max}</Text>
      )}

      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(Math.min(max, current + 1))}
      >
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    backgroundColor: '#2c3e50', width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 20 },
  pips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1, justifyContent: 'center' },
  pip: { width: 14, height: 14, borderRadius: 7 },
  pipFilled: { backgroundColor: '#2ecc71' },
  pipEmpty: { backgroundColor: '#2c3e50', borderWidth: 1, borderColor: '#555' },
  counter: { color: '#fff', fontSize: 22, fontWeight: '900', flex: 1, textAlign: 'center' },
});
