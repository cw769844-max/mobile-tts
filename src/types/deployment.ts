export interface Point {
  x: number;
  y: number;
}

export interface DeploymentZone {
  polygon: Point[];
  label: string;
}

export interface DeploymentConfig {
  id: string;
  name: string;
  p1Zone: Point[];
  p2Zone: Point[];
  noMansLand?: Point[];
  objectiveSuggestions?: Point[];
}
