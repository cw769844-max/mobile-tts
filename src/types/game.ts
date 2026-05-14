export type PlayerId = 'p1' | 'p2';

export type GamePhase = 'command' | 'movement' | 'shooting' | 'charge' | 'fight';

export type GameStatus = 'waiting' | 'active' | 'ended';

export type MeasureMode = 'off' | 'ruler' | 'circle' | 'coherency';

export interface UnitStats {
  M: number;
  T: number;
  Sv: number;
  W: number;
  Ld: number;
  OC: number;
  BS: number;
  WS: number;
  invulSv: number | null;
}

export const DEFAULT_STATS: UnitStats = {
  M: 6, T: 4, Sv: 4, W: 2, Ld: 7, OC: 2, BS: 4, WS: 4, invulSv: null,
};

export interface TokenStatus {
  battleShocked: boolean;
  inReserve: boolean;
  hasActivated: boolean;
}

export interface Token {
  id: string;
  name: string;
  ownerId: PlayerId;
  x: number;
  y: number;
  imageUrl: string;
  stats: UnitStats;
  woundsRemaining: number;
  status: TokenStatus;
  sizeInches: number;
  isObjective: boolean;
  objectiveLabel?: string;
}

export interface VpEntry {
  round: number;
  player: PlayerId;
  amount: number;
  reason: string;
  timestamp: number;
}

export interface PlayerScore {
  vp: number;
  cp: number;
  vpLog: VpEntry[];
}

export type MissionType =
  | 'Abandoned Sanctum'
  | 'Chilling Rain'
  | 'Crucible of Battle'
  | 'Decisive Action'
  | 'Linchpin'
  | 'Matched Reserves'
  | 'Scorched Earth'
  | 'Seize and Hold'
  | 'Swift Acquisition';

export type DeploymentType =
  | 'dawn-of-war'
  | 'hammer-and-anvil'
  | 'search-and-destroy'
  | 'sweeping-engagement'
  | 'crucible-of-battle';

export interface Objective {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GameConfig {
  mapImageUrl: string | null;
  boardScaleInchesPerPx: number;
  boardWidthInches: number;
  boardHeightInches: number;
  missionType: MissionType;
  deploymentType: DeploymentType;
  objectives: Objective[];
  timerEnabled: boolean;
  minutesPerPlayer: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  mapImageUrl: null,
  boardScaleInchesPerPx: 1 / 12,
  boardWidthInches: 60,
  boardHeightInches: 44,
  missionType: 'Seize and Hold',
  deploymentType: 'dawn-of-war',
  objectives: [],
  timerEnabled: false,
  minutesPerPlayer: 75,
};

export interface GameState {
  round: number;
  phase: GamePhase;
  activePlayer: PlayerId;
  status: GameStatus;
}

export interface PlayerMeta {
  uid: string;
  name: string;
  connected: boolean;
}

export interface GameMeta {
  code: string;
  createdAt: number;
  p1: PlayerMeta;
  p2: PlayerMeta | null;
}

export interface StratagemLog {
  round: number;
  phase: GamePhase;
  player: PlayerId;
  stratagemName: string;
  cpCost: number;
  timestamp: number;
}

export interface GameRoom {
  id: string;
  meta: GameMeta;
  config: GameConfig;
  state: GameState;
  scores: Record<PlayerId, PlayerScore>;
  tokens: Record<string, Token>;
  stratagemLog?: StratagemLog[];
}

// Dice types
export type DieType = 'D2' | 'D3' | 'D6' | '2D6';

export interface DiceRollResult {
  dieType: DieType;
  count: number;
  results: number[];
  total: number;
}

export interface CombatInput {
  attacks: number;
  skill: number;
  strength: number;
  ap: number;
  damage: number;
  targetT: number;
  targetSv: number;
  targetInvul: number | null;
  rerollHits: 'none' | 'ones' | 'all';
  rerollWounds: 'none' | 'ones' | 'all';
  lethalHits: boolean;
  devastatingWounds: boolean;
  sustainedHits: number;
}

export const DEFAULT_COMBAT_INPUT: CombatInput = {
  attacks: 4,
  skill: 3,
  strength: 4,
  ap: 0,
  damage: 1,
  targetT: 4,
  targetSv: 4,
  targetInvul: null,
  rerollHits: 'none',
  rerollWounds: 'none',
  lethalHits: false,
  devastatingWounds: false,
  sustainedHits: 0,
};

export interface CombatStepResult {
  rolls: number[];
  successes: number;
  label: string;
}

export interface CombatResult {
  hitStep: CombatStepResult;
  woundStep: CombatStepResult;
  saveStep: CombatStepResult;
  totalDamage: number;
  mortals: number;
}
