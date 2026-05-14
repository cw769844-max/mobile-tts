import React from 'react';
import { Image, useImage, Rect, Group } from '@shopify/react-native-skia';
import { useGameStore } from '../../store/gameStore';
import { inchesToPx } from '../../game/scaling';

export function MapLayer() {
  const config = useGameStore((s) => s.room?.config);
  const image = useImage(config?.mapImageUrl ?? null);

  if (!config) return null;

  const boardW = inchesToPx(config.boardWidthInches, config.boardScaleInchesPerPx);
  const boardH = inchesToPx(config.boardHeightInches, config.boardScaleInchesPerPx);

  return (
    <Group>
      {/* Dark fallback background */}
      <Rect x={0} y={0} width={boardW} height={boardH} color="#0d1117" />
      {image && (
        <Image
          image={image}
          x={0}
          y={0}
          width={boardW}
          height={boardH}
          fit="fill"
        />
      )}
    </Group>
  );
}
