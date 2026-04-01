// ============================================================
// KINETICA: Shared Game Types
// ============================================================

export type GamePhase =
  | 'lobby'
  | 'configuration'
  | 'potion-crafting'
  | 'catapult'
  | 'racing'
  | 'results'
  | 'final-results';

export type Planet = 'earth' | 'mars' | 'mercury';

export type MuscleGroup = 'quadriceps' | 'hamstrings' | 'calves' | 'core' | 'upperBody';

export type EnergySystem = 'atpPc' | 'anaerobic' | 'aerobic';

export type RaceSection = 'sprint' | 'swim' | 'jump' | 'obstacle';

export interface MuscleSelection {
  quadriceps: boolean;
  hamstrings: boolean;
  calves: boolean;
  core: boolean;
  upperBody: boolean;
}

export interface EnergyAllocation {
  atpPc: number;     // 0-100, explosive
  anaerobic: number;  // 0-100, burst
  aerobic: number;    // 0-100, endurance
}

export interface Potion {
  id: string;
  name: string;
  elements: string[];
  effect: string;
  stat: string;
  magnitude: number;
  description: string;
  color: string;
}

export interface CatapultConfig {
  angle: number;   // degrees
  force: number;   // 0-100
}

export interface CatapultResult {
  distance: number;
  airTime: number;
  maxHeight: number;
  headStart: number; // seconds advantage
}

export interface PlayerConfig {
  muscles: MuscleSelection;
  energy: EnergyAllocation;
  potions: Potion[];
  mass: number; // 50-120 kg
  catapult: CatapultConfig;
}

export interface RaceSectionResult {
  section: RaceSection;
  time: number;
  speed: number;
  fatigue: number;
  events: string[];
}

export interface RaceResult {
  planet: Planet;
  sections: RaceSectionResult[];
  totalTime: number;
  catapultResult: CatapultResult;
  feedback: string[];
}

export interface Player {
  id: string;
  name: string;
  avatar: number; // 0-7 avatar index
  config: PlayerConfig;
  raceResults: RaceResult[];
  totalTime: number;
  isHost: boolean;
  isReady: boolean;
  currentPhase: GamePhase;
}

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  players: Map<string, Player>;
  phase: GamePhase;
  currentPlanet: Planet;
  currentPlayerIndex: number;
  planetOrder: Planet[];
  createdAt: number;
}

// Chemistry data
export interface Element {
  symbol: string;
  name: string;
  category: 'organic' | 'ion' | 'gas' | 'metal' | 'compound';
  color: string;
}

export interface Recipe {
  elements: string[];
  potion: Omit<Potion, 'id'>;
}

// Planet physics
export interface PlanetPhysics {
  gravity: number;
  name: string;
  description: string;
  terrain: RaceSection[];
  altitudeFactor: number;
  heatFactor: number;
  oxygenFactor: number;
}

// Performance calculation inputs
export interface PerformanceInput {
  config: PlayerConfig;
  planet: PlanetPhysics;
  section: RaceSection;
  currentFatigue: number;
}

export interface PerformanceOutput {
  speed: number;
  jumpHeight: number;
  fatigueRate: number;
  sectionTime: number;
  events: string[];
}
