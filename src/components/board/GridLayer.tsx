import React, { useMemo } from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import { useGameStore } from '../../store/gameStore';
import { useBoardStore } from '../../store/boardStore';
import { inchesToPx } from '../../game/scaling';

export function GridLayer() {
  const showGrid = useBoardStore((s) => s.showGrid);
  const config = useGameStore((s) => s.room?.config);

  const path = useMemo(() => {
    if (!config || !showGrid) return null;
    const { boardWidthInches, boardHeightInches, boardScaleInchesPerPx } = config;
    const boardW = inchesToPx(boardWidthInches, boardScaleInchesPerPx);
    const boardH = inchesToPx(boardHeightInches, boardScaleInchesPerPx);
    const step = inchesToPx(6, boardScaleInchesPerPx); // major lines every 6"

    const p = Skia.Path.Make();
    for (let x = 0; x <= boardW; x += step) {
      p.moveTo(x, 0);
      p.lineTo(x, boardH);
    }
    for (let y = 0; y <= boardH; y += step) {
      p.moveTo(0, y);
      p.lineTo(boardW, y);
    }
    return p;
  }, [config, showGrid]);

  if (!path || !showGrid) return null;

  return (
    <Path
      path={path}
      color="rgba(255,255,255,0.08)"
      style="stroke"
      strokeWidth={0.5}
    />
  );
}
