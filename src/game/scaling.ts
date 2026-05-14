// Converts between board pixels and game inches.
// boardScaleInchesPerPx: how many inches one pixel represents.
// Default 1/12 means 12px = 1 inch (a 60" board = 720px wide).

export function pxToInches(px: number, inchesPerPx: number): number {
  return px * inchesPerPx;
}

export function inchesToPx(inches: number, inchesPerPx: number): number {
  return inches / inchesPerPx;
}

export function boardPixelSize(
  widthInches: number,
  heightInches: number,
  inchesPerPx: number,
): { width: number; height: number } {
  return {
    width: inchesToPx(widthInches, inchesPerPx),
    height: inchesToPx(heightInches, inchesPerPx),
  };
}

export function screenToBoard(
  screenX: number,
  screenY: number,
  panX: number,
  panY: number,
  cameraScale: number,
): { x: number; y: number } {
  return {
    x: (screenX - panX) / cameraScale,
    y: (screenY - panY) / cameraScale,
  };
}

export function boardToScreen(
  boardX: number,
  boardY: number,
  panX: number,
  panY: number,
  cameraScale: number,
): { x: number; y: number } {
  return {
    x: boardX * cameraScale + panX,
    y: boardY * cameraScale + panY,
  };
}

export function distancePx(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function hitTestToken(
  boardX: number,
  boardY: number,
  tokenBoardX: number,
  tokenBoardY: number,
  tokenRadiusPx: number,
  slop = 8,
): boolean {
  return distancePx(boardX, boardY, tokenBoardX, tokenBoardY) <= tokenRadiusPx + slop;
}
