import React, { useMemo } from 'react';
import { Path, Skia, Group, Text as SkiaText, matchFont } from '@shopify/react-native-skia';
import { useGameStore } from '../../store/gameStore';
import { useBoardStore } from '../../store/boardStore';
import { DEPLOYMENT_CONFIGS } from '../../data/deployment-configs';
import { inchesToPx } from '../../game/scaling';
import { Point } from '../../types/deployment';

function makePolygonPath(points: Point[], inchesPerPx: number) {
  const path = Skia.Path.Make();
  points.forEach((pt, i) => {
    const x = inchesToPx(pt.x, inchesPerPx);
    const y = inchesToPx(pt.y, inchesPerPx);
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  path.close();
  return path;
}

export function DeploymentLayer() {
  const showDeploymentZones = useBoardStore((s) => s.showDeploymentZones);
  const config = useGameStore((s) => s.room?.config);

  const deployment = useMemo(() => {
    if (!config) return null;
    return DEPLOYMENT_CONFIGS.find((d) => d.id === config.deploymentType) ?? null;
  }, [config?.deploymentType]);

  if (!showDeploymentZones || !deployment || !config) return null;

  const { boardScaleInchesPerPx } = config;

  const p1Path = makePolygonPath(deployment.p1Zone, boardScaleInchesPerPx);
  const p2Path = makePolygonPath(deployment.p2Zone, boardScaleInchesPerPx);
  const nmlPath = deployment.noMansLand
    ? makePolygonPath(deployment.noMansLand, boardScaleInchesPerPx)
    : null;

  return (
    <Group>
      {nmlPath && (
        <Path path={nmlPath} color="rgba(255,255,255,0.04)" style="fill" />
      )}
      <Path path={p1Path} color="rgba(52,152,219,0.18)" style="fill" />
      <Path path={p1Path} color="rgba(52,152,219,0.6)" style="stroke" strokeWidth={2} />
      <Path path={p2Path} color="rgba(192,57,43,0.18)" style="fill" />
      <Path path={p2Path} color="rgba(192,57,43,0.6)" style="stroke" strokeWidth={2} />
    </Group>
  );
}
