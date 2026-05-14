import { DeploymentConfig } from '../types/deployment';

// All 5 standard 10th edition deployment configurations for a 60"×44" board.
// Coordinates are in inches from the top-left corner of the board.
export const DEPLOYMENT_CONFIGS: DeploymentConfig[] = [
  {
    id: 'dawn-of-war',
    name: 'Dawn of War',
    p1Zone: [
      { x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 12 }, { x: 0, y: 12 },
    ],
    p2Zone: [
      { x: 0, y: 32 }, { x: 60, y: 32 }, { x: 60, y: 44 }, { x: 0, y: 44 },
    ],
    noMansLand: [
      { x: 0, y: 12 }, { x: 60, y: 12 }, { x: 60, y: 32 }, { x: 0, y: 32 },
    ],
    objectiveSuggestions: [
      { x: 10, y: 6 }, { x: 30, y: 6 }, { x: 50, y: 6 },
      { x: 10, y: 38 }, { x: 30, y: 38 }, { x: 50, y: 38 },
    ],
  },
  {
    id: 'hammer-and-anvil',
    name: 'Hammer & Anvil',
    // Short board edges — players deploy on the 44" ends
    p1Zone: [
      { x: 0, y: 0 }, { x: 22, y: 0 }, { x: 22, y: 44 }, { x: 0, y: 44 },
    ],
    p2Zone: [
      { x: 38, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 44 }, { x: 38, y: 44 },
    ],
    noMansLand: [
      { x: 22, y: 0 }, { x: 38, y: 0 }, { x: 38, y: 44 }, { x: 22, y: 44 },
    ],
    objectiveSuggestions: [
      { x: 11, y: 11 }, { x: 11, y: 33 },
      { x: 30, y: 22 },
      { x: 49, y: 11 }, { x: 49, y: 33 },
    ],
  },
  {
    id: 'search-and-destroy',
    name: 'Search & Destroy',
    // Diagonal deployment — opposite corners
    p1Zone: [
      { x: 0, y: 0 }, { x: 24, y: 0 }, { x: 0, y: 24 },
    ],
    p2Zone: [
      { x: 36, y: 44 }, { x: 60, y: 44 }, { x: 60, y: 20 },
    ],
    objectiveSuggestions: [
      { x: 10, y: 10 }, { x: 30, y: 22 }, { x: 50, y: 34 },
      { x: 10, y: 34 }, { x: 50, y: 10 },
    ],
  },
  {
    id: 'sweeping-engagement',
    name: 'Sweeping Engagement',
    // Both players deploy on the long edges — mirrored 9" strips
    p1Zone: [
      { x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 9 }, { x: 0, y: 9 },
    ],
    p2Zone: [
      { x: 0, y: 35 }, { x: 60, y: 35 }, { x: 60, y: 44 }, { x: 0, y: 44 },
    ],
    noMansLand: [
      { x: 0, y: 9 }, { x: 60, y: 9 }, { x: 60, y: 35 }, { x: 0, y: 35 },
    ],
    objectiveSuggestions: [
      { x: 10, y: 22 }, { x: 30, y: 22 }, { x: 50, y: 22 },
      { x: 20, y: 5 }, { x: 40, y: 39 },
    ],
  },
  {
    id: 'crucible-of-battle',
    name: 'Crucible of Battle',
    // 12" diagonal quarters
    p1Zone: [
      { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 0, y: 20 },
      { x: 40, y: 44 }, { x: 60, y: 44 }, { x: 60, y: 24 },
    ],
    p2Zone: [
      { x: 40, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 20 },
      { x: 0, y: 24 }, { x: 0, y: 44 }, { x: 20, y: 44 },
    ],
    objectiveSuggestions: [
      { x: 8, y: 8 }, { x: 52, y: 36 },
      { x: 52, y: 8 }, { x: 8, y: 36 },
      { x: 30, y: 22 },
    ],
  },
];
