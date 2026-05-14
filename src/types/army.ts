import { UnitStats, PlayerId } from './game';

export interface WeaponProfile {
  name: string;
  range: string;
  attacks: string;
  bs: string;
  strength: number;
  ap: number;
  damage: string;
  abilities: string[];
  keywords: string[];
}

export interface Datasheet {
  id: string;
  name: string;
  stats: UnitStats;
  weapons: WeaponProfile[];
  abilities: string[];
  keywords: string[];
  pointsCost: number;
  modelCount: number;
}

export interface ArmyList {
  faction: string;
  detachment: string;
  totalPoints: number;
  units: Datasheet[];
  importedAt: number;
}
