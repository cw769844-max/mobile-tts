import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useBoardStore, ActiveTool } from '../../store/boardStore';

interface ToolBtnProps {
  label: string;
  tool: ActiveTool;
  active: boolean;
  onPress: () => void;
}

function ToolBtn({ label, active, onPress }: ToolBtnProps) {
  return (
    <TouchableOpacity
      style={[styles.btn, active && styles.btnActive]}
      onPress={onPress}
    >
      <Text style={[styles.btnText, active && styles.btnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function MeasureToolbar() {
  const { activeTool, setActiveTool, showGrid, toggleGrid, showDeploymentZones, toggleDeploymentZones } = useBoardStore();

  function toggleTool(tool: ActiveTool) {
    setActiveTool(activeTool === tool ? 'select' : tool);
  }

  return (
    <View style={styles.container}>
      <ToolBtn label="📏 Ruler" tool="ruler" active={activeTool === 'ruler'} onPress={() => toggleTool('ruler')} />
      <ToolBtn label="⭕ Range" tool="circle" active={activeTool === 'circle'} onPress={() => toggleTool('circle')} />
      <ToolBtn label="🔵 Coherency" tool="coherency" active={activeTool === 'coherency'} onPress={() => toggleTool('coherency')} />
      <TouchableOpacity style={[styles.btn, showGrid && styles.btnActive]} onPress={toggleGrid}>
        <Text style={[styles.btnText, showGrid && styles.btnTextActive]}>Grid</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, showDeploymentZones && styles.btnActive]} onPress={toggleDeploymentZones}>
        <Text style={[styles.btnText, showDeploymentZones && styles.btnTextActive]}>Zones</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 10, paddingVertical: 6,
  },
  btn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
    backgroundColor: '#2c3e50',
  },
  btnActive: { backgroundColor: '#f39c12' },
  btnText: { color: '#aaa', fontSize: 12, fontWeight: '700' },
  btnTextActive: { color: '#1a1a2e' },
});
