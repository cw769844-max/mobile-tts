import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import {
  Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import { MapLayer } from './MapLayer';
import { GridLayer } from './GridLayer';
import { TokenLayer } from './TokenLayer';
import { MeasureLayer } from './MeasureLayer';
import { DeploymentLayer } from './DeploymentLayer';
import { useGameStore } from '../../store/gameStore';
import { useBoardStore, ActiveTool } from '../../store/boardStore';
import { screenToBoard, hitTestToken, inchesToPx } from '../../game/scaling';
import { Token } from '../../types/game';

const MIN_SCALE = 0.3;
const MAX_SCALE = 4;

function clamp(val: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(val, min), max);
}

export function GameBoard() {
  const room = useGameStore((s) => s.room);
  const localPlayer = useGameStore((s) => s.localPlayer);
  const selectedTokenId = useGameStore((s) => s.selectedTokenId);
  const { selectToken, moveToken, setDraggingToken } = useGameStore();
  const { activeTool, setMeasureState, setCamera } = useBoardStore();

  // Camera shared values (on UI thread for 60fps)
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Pinch base values
  const basePanX = useSharedValue(0);
  const basePanY = useSharedValue(0);
  const baseScale = useSharedValue(1);

  // Token drag
  const draggingId = useSharedValue<string | null>(null);
  const [draggingPositions, setDraggingPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Skia camera transform (useDerivedValue drives Skia on UI thread)
  const cameraTransform = useDerivedValue(() => [
    { translateX: panX.value },
    { translateY: panY.value },
    { scale: scale.value },
  ]);

  const tokens = room ? Object.values(room.tokens) : [];
  const config = room?.config;

  const getTokenAt = useCallback((sx: number, sy: number): Token | null => {
    if (!config) return null;
    const board = screenToBoard(sx, sy, panX.value, panY.value, scale.value);
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      if (t.status.inReserve) continue;
      const radiusPx = inchesToPx(t.sizeInches / 2, config.boardScaleInchesPerPx);
      if (hitTestToken(board.x, board.y, t.x, t.y, radiusPx)) return t;
    }
    return null;
  }, [tokens, config, panX, panY, scale]);

  const commitTokenMove = useCallback((id: string, bx: number, by: number) => {
    setDraggingToken(null);
    setDraggingPositions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    moveToken(id, bx, by);
  }, [moveToken, setDraggingToken]);

  // ---- Gestures ----

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      'worklet';
      basePanX.value = panX.value;
      basePanY.value = panY.value;
      baseScale.value = scale.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newScale = clamp(baseScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      const focalBoardX = (e.focalX - basePanX.value) / baseScale.value;
      const focalBoardY = (e.focalY - basePanY.value) / baseScale.value;
      panX.value = e.focalX - focalBoardX * newScale;
      panY.value = e.focalY - focalBoardY * newScale;
      scale.value = newScale;
    })
    .onEnd(() => {
      'worklet';
      runOnJS(setCamera)(panX.value, panY.value, scale.value);
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      basePanX.value = panX.value;
      basePanY.value = panY.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (draggingId.value !== null) return; // token drag takes over
      panX.value = basePanX.value + e.translationX;
      panY.value = basePanY.value + e.translationY;
    })
    .onEnd(() => {
      'worklet';
      runOnJS(setCamera)(panX.value, panY.value, scale.value);
    })
    .minDistance(4);

  const tokenDrag = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      runOnJS(handleDragBegin)(e.x, e.y);
    })
    .onUpdate((e) => {
      'worklet';
      if (draggingId.value === null) return;
      const id = draggingId.value;
      const bx = (e.x - panX.value) / scale.value;
      const by = (e.y - panY.value) / scale.value;
      runOnJS(setDraggingPositions)((prev: Record<string, { x: number; y: number }>) => ({
        ...prev, [id]: { x: bx, y: by },
      }));
    })
    .onEnd((e) => {
      'worklet';
      if (draggingId.value === null) return;
      const id = draggingId.value;
      const bx = (e.x - panX.value) / scale.value;
      const by = (e.y - panY.value) / scale.value;
      draggingId.value = null;
      runOnJS(commitTokenMove)(id, bx, by);
    })
    .minDistance(4);

  const tap = Gesture.Tap()
    .onEnd((e) => {
      'worklet';
      runOnJS(handleTap)(e.x, e.y);
    });

  function handleDragBegin(sx: number, sy: number) {
    const token = getTokenAt(sx, sy);
    if (token && token.ownerId === localPlayer && !token.isObjective) {
      draggingId.value = token.id;
      setDraggingToken(token.id);
    }
  }

  function handleTap(sx: number, sy: number) {
    if (activeTool === 'ruler') {
      // ruler is managed by its own drag gesture below
      return;
    }
    if (activeTool === 'circle') {
      setMeasureState({ circleX: 0, circleY: 0, circleRadius: 0, pinned: false });
      return;
    }
    const token = getTokenAt(sx, sy);
    selectToken(token?.id ?? null);
  }

  const measureDrag = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      if (activeTool !== 'ruler' && activeTool !== 'circle') return;
      const bx = (e.x - panX.value) / scale.value;
      const by = (e.y - panY.value) / scale.value;
      runOnJS(setMeasureState)({ startX: bx, startY: by, endX: bx, endY: by });
    })
    .onUpdate((e) => {
      'worklet';
      if (activeTool !== 'ruler' && activeTool !== 'circle') return;
      const bx = (e.x - panX.value) / scale.value;
      const by = (e.y - panY.value) / scale.value;
      if (activeTool === 'ruler') {
        runOnJS(setMeasureState)({ endX: bx, endY: by });
      } else {
        const { measureState } = useBoardStore.getState();
        const dr = Math.hypot(bx - measureState.circleX, by - measureState.circleY);
        runOnJS(setMeasureState)({ circleRadius: dr });
      }
    })
    .minDistance(2);

  const composed = Gesture.Simultaneous(
    Gesture.Exclusive(tokenDrag, pan, measureDrag),
    pinch,
    tap,
  );

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={cameraTransform}>
            <MapLayer />
            <GridLayer />
            <DeploymentLayer />
            <MeasureLayer />
            <TokenLayer
              tokens={tokens}
              inchesPerPx={config?.boardScaleInchesPerPx ?? 1 / 12}
              selectedTokenId={selectedTokenId}
              draggingPositions={draggingPositions}
            />
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
