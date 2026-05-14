import React from 'react';
import {
  Circle, Path, Skia, Group, Text as SkiaText, matchFont,
} from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { useBoardStore } from '../../store/boardStore';
import { useGameStore } from '../../store/gameStore';
import { pxToInches, inchesToPx, distancePx } from '../../game/scaling';

const font = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' }) ?? 'sans-serif',
  fontSize: 14,
  fontWeight: '700',
});

export function MeasureLayer() {
  const { activeTool, measureState } = useBoardStore();
  const config = useGameStore((s) => s.room?.config);
  const selectedTokenId = useGameStore((s) => s.selectedTokenId);
  const tokens = useGameStore((s) => s.room?.tokens ?? {});

  if (!config) return null;
  const { boardScaleInchesPerPx } = config;

  const renderRuler = () => {
    if (activeTool !== 'ruler') return null;
    const { startX, startY, endX, endY } = measureState;
    if (startX === endX && startY === endY) return null;

    const path = Skia.Path.Make();
    path.moveTo(startX, startY);
    path.lineTo(endX, endY);

    const distPx = distancePx(startX, startY, endX, endY);
    const distIn = pxToInches(distPx, boardScaleInchesPerPx);
    const label = `${distIn.toFixed(1)}"`;
    const midX = (startX + endX) / 2 + 6;
    const midY = (startY + endY) / 2 - 6;

    return (
      <Group>
        <Path path={path} color="#f1c40f" style="stroke" strokeWidth={2} strokeCap="round" />
        <Circle cx={startX} cy={startY} r={4} color="#f1c40f" />
        <Circle cx={endX} cy={endY} r={4} color="#f1c40f" />
        {font && (
          <SkiaText x={midX} y={midY} text={label} font={font} color="#f1c40f" />
        )}
      </Group>
    );
  };

  const renderCircle = () => {
    if (activeTool !== 'circle') return null;
    const { circleX, circleY, circleRadius } = measureState;
    if (circleRadius === 0) return null;

    const radiusIn = pxToInches(circleRadius, boardScaleInchesPerPx);
    const label = `r=${radiusIn.toFixed(1)}"`;

    return (
      <Group>
        <Circle
          cx={circleX} cy={circleY} r={circleRadius}
          color="rgba(241,196,15,0.15)" style="fill"
        />
        <Circle
          cx={circleX} cy={circleY} r={circleRadius}
          color="#f1c40f" style="stroke" strokeWidth={2}
        />
        {font && (
          <SkiaText
            x={circleX + circleRadius + 6} y={circleY}
            text={label} font={font} color="#f1c40f"
          />
        )}
      </Group>
    );
  };

  const renderCoherency = () => {
    if (activeTool !== 'coherency' || !selectedTokenId) return null;
    const token = tokens[selectedTokenId];
    if (!token) return null;

    const coherencyPx = inchesToPx(2, boardScaleInchesPerPx);

    return (
      <Circle
        cx={token.x} cy={token.y} r={coherencyPx}
        color="rgba(46,204,113,0.2)" style="fill"
      />
    );
  };

  return (
    <Group>
      {renderRuler()}
      {renderCircle()}
      {renderCoherency()}
    </Group>
  );
}
