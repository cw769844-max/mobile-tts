import React from 'react';
import {
  Group, Circle, Image, useImage, Text as SkiaText, matchFont, RoundedRect,
} from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { Token } from '../../types/game';
import { inchesToPx } from '../../game/scaling';

const font = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' }) ?? 'sans-serif',
  fontSize: 11,
  fontWeight: '700',
});

const fontSmall = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' }) ?? 'sans-serif',
  fontSize: 9,
  fontWeight: '400',
});

const P1_COLOR = '#3498db';
const P2_COLOR = '#c0392b';
const OBJECTIVE_COLOR = '#f39c12';

interface TokenNodeProps {
  token: Token;
  inchesPerPx: number;
  selected: boolean;
  overrideX?: number;
  overrideY?: number;
}

function TokenNode({ token, inchesPerPx, selected, overrideX, overrideY }: TokenNodeProps) {
  const image = useImage(token.imageUrl);
  const cx = overrideX ?? token.x;
  const cy = overrideY ?? token.y;
  const radiusPx = inchesToPx(token.sizeInches / 2, inchesPerPx);

  const borderColor = token.isObjective
    ? OBJECTIVE_COLOR
    : token.ownerId === 'p1' ? P1_COLOR : P2_COLOR;

  const woundPct = token.stats.W > 0 ? token.woundsRemaining / token.stats.W : 1;
  const woundColor = woundPct > 0.5 ? '#2ecc71' : woundPct > 0.25 ? '#f39c12' : '#e74c3c';

  return (
    <Group transform={[{ translateX: cx }, { translateY: cy }]}>
      {/* Selection ring */}
      {selected && (
        <Circle cx={0} cy={0} r={radiusPx + 6} color="rgba(255,255,255,0.3)" />
      )}

      {/* Owner border */}
      <Circle cx={0} cy={0} r={radiusPx + 3} color={borderColor} />

      {/* Token image or fallback circle */}
      {image ? (
        <Group clip={Skia.Path.Make().addCircle(0, 0, radiusPx)}>
          <Image
            image={image}
            x={-radiusPx} y={-radiusPx}
            width={radiusPx * 2} height={radiusPx * 2}
            fit="cover"
          />
        </Group>
      ) : (
        <Circle cx={0} cy={0} r={radiusPx} color="#2c3e50" />
      )}

      {/* Battle-shocked overlay */}
      {token.status.battleShocked && (
        <Circle cx={0} cy={0} r={radiusPx} color="rgba(155,89,182,0.4)" />
      )}

      {/* Name label */}
      {font && !token.isObjective && (
        <SkiaText
          x={-radiusPx}
          y={radiusPx + 14}
          text={token.name.length > 10 ? token.name.slice(0, 10) + '…' : token.name}
          font={font}
          color="#fff"
        />
      )}

      {/* Objective label */}
      {token.isObjective && token.objectiveLabel && font && (
        <SkiaText
          x={-6}
          y={5}
          text={token.objectiveLabel}
          font={font}
          color="#1a1a2e"
        />
      )}

      {/* Wound counter badge */}
      {!token.isObjective && token.stats.W <= 10 && (
        <Group transform={[{ translateX: radiusPx - 8 }, { translateY: -radiusPx }]}>
          <RoundedRect x={-8} y={-10} width={22} height={14} r={4} color="#1a1a2e" />
          <SkiaText
            x={-4} y={0}
            text={`${token.woundsRemaining}`}
            font={fontSmall}
            color={woundColor}
          />
        </Group>
      )}

      {/* Reserve indicator */}
      {token.status.inReserve && (
        <Circle cx={0} cy={0} r={radiusPx} color="rgba(0,0,0,0.6)" />
      )}
    </Group>
  );
}

// Need Skia import for clip path
import { Skia } from '@shopify/react-native-skia';

interface TokenLayerProps {
  tokens: Token[];
  inchesPerPx: number;
  selectedTokenId: string | null;
  draggingPositions: Record<string, { x: number; y: number }>;
}

export function TokenLayer({ tokens, inchesPerPx, selectedTokenId, draggingPositions }: TokenLayerProps) {
  return (
    <Group>
      {tokens.map((token) => (
        <TokenNode
          key={token.id}
          token={token}
          inchesPerPx={inchesPerPx}
          selected={token.id === selectedTokenId}
          overrideX={draggingPositions[token.id]?.x}
          overrideY={draggingPositions[token.id]?.y}
        />
      ))}
    </Group>
  );
}
