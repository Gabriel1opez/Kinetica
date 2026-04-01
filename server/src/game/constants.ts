import { Element, PlanetPhysics, Recipe } from './types';

// ============================================================
// PLANET CONFIGURATIONS
// ============================================================
export const PLANETS: Record<string, PlanetPhysics> = {
  earth: {
    gravity: 9.8,
    name: 'Earth',
    description: 'Multi-biome terrain with varied challenges',
    terrain: ['sprint', 'swim', 'jump', 'obstacle'],
    altitudeFactor: 1.0,
    heatFactor: 1.0,
    oxygenFactor: 1.0,
  },
  mars: {
    gravity: 3.7,
    name: 'Mars',
    description: 'Low gravity - higher jumps, slower acceleration',
    terrain: ['sprint', 'jump', 'obstacle', 'sprint'],
    altitudeFactor: 1.3,
    heatFactor: 0.8,
    oxygenFactor: 0.4,
  },
  mercury: {
    gravity: 3.7,
    name: 'Mercury',
    description: 'Extreme heat - increased fatigue, reduced endurance',
    terrain: ['sprint', 'obstacle', 'sprint', 'jump'],
    altitudeFactor: 1.0,
    heatFactor: 2.5,
    oxygenFactor: 0.2,
  },
};

// ============================================================
// CHEMISTRY: ELEMENTS & RECIPES
// ============================================================
export const ELEMENTS: Element[] = [
  { symbol: 'C₆H₁₂O₆', name: 'Glucose', category: 'organic', color: '#ffd700' },
  { symbol: 'O₂', name: 'Oxygen', category: 'gas', color: '#87ceeb' },
  { symbol: 'Na⁺', name: 'Sodium Ion', category: 'ion', color: '#ff8c00' },
  { symbol: 'K⁺', name: 'Potassium Ion', category: 'ion', color: '#9370db' },
  { symbol: 'Fe', name: 'Iron', category: 'metal', color: '#cd853f' },
  { symbol: 'Ca²⁺', name: 'Calcium Ion', category: 'ion', color: '#f5f5dc' },
  { symbol: 'H₂O', name: 'Water', category: 'compound', color: '#4169e1' },
  { symbol: 'ATP', name: 'Adenosine Triphosphate', category: 'organic', color: '#39ff14' },
  { symbol: 'CO₂', name: 'Carbon Dioxide', category: 'gas', color: '#808080' },
  { symbol: 'N₂', name: 'Nitrogen', category: 'gas', color: '#b0c4de' },
  { symbol: 'Mg²⁺', name: 'Magnesium Ion', category: 'ion', color: '#98fb98' },
  { symbol: 'PO₄³⁻', name: 'Phosphate', category: 'ion', color: '#dda0dd' },
  { symbol: 'HCO₃⁻', name: 'Bicarbonate', category: 'ion', color: '#f0e68c' },
  { symbol: 'Creatine', name: 'Creatine', category: 'organic', color: '#ff6347' },
  { symbol: 'Caffeine', name: 'Caffeine', category: 'organic', color: '#8b4513' },
  { symbol: 'Lactic Acid', name: 'Lactic Acid', category: 'organic', color: '#ff4500' },
];

export const RECIPES: Recipe[] = [
  {
    elements: ['C₆H₁₂O₆', 'O₂'],
    potion: {
      name: 'Energy Surge',
      elements: ['C₆H₁₂O₆', 'O₂'],
      effect: 'Aerobic respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38 ATP',
      stat: 'stamina',
      magnitude: 25,
      description: 'Glucose oxidation produces maximum ATP for sustained energy',
      color: '#ffd700',
    },
  },
  {
    elements: ['Na⁺', 'K⁺'],
    potion: {
      name: 'Electrolyte Boost',
      elements: ['Na⁺', 'K⁺'],
      effect: 'Na⁺/K⁺ pump maintains membrane potential for muscle contraction',
      stat: 'fatigue_reduction',
      magnitude: 20,
      description: 'Electrolyte balance prevents muscle cramps and delays fatigue',
      color: '#ff8c00',
    },
  },
  {
    elements: ['Fe', 'O₂'],
    potion: {
      name: 'Hemoglobin Elixir',
      elements: ['Fe', 'O₂'],
      effect: 'Iron binds O₂ in hemoglobin, improving oxygen transport to muscles',
      stat: 'endurance',
      magnitude: 22,
      description: 'Enhanced oxygen delivery for improved aerobic performance',
      color: '#cd853f',
    },
  },
  {
    elements: ['Ca²⁺', 'ATP'],
    potion: {
      name: 'Muscle Contract Potion',
      elements: ['Ca²⁺', 'ATP'],
      effect: 'Ca²⁺ triggers actin-myosin cross-bridge cycling, ATP powers detachment',
      stat: 'speed',
      magnitude: 20,
      description: 'Optimizes sliding filament mechanism for faster contractions',
      color: '#39ff14',
    },
  },
  {
    elements: ['Creatine', 'PO₄³⁻'],
    potion: {
      name: 'Phosphocreatine Burst',
      elements: ['Creatine', 'PO₄³⁻'],
      effect: 'Creatine + PO₄³⁻ → Phosphocreatine, rapidly regenerates ATP',
      stat: 'explosive_power',
      magnitude: 30,
      description: 'ATP-PC system boost for explosive sprints and jumps',
      color: '#ff6347',
    },
  },
  {
    elements: ['H₂O', 'Na⁺'],
    potion: {
      name: 'Hydration Tonic',
      elements: ['H₂O', 'Na⁺'],
      effect: 'Sodium-driven water absorption maintains blood volume and cooling',
      stat: 'heat_resistance',
      magnitude: 25,
      description: 'Prevents dehydration and maintains thermoregulation',
      color: '#4169e1',
    },
  },
  {
    elements: ['Caffeine', 'ATP'],
    potion: {
      name: 'Neural Accelerant',
      elements: ['Caffeine', 'ATP'],
      effect: 'Caffeine blocks adenosine receptors, reducing perceived fatigue',
      stat: 'reaction_time',
      magnitude: 18,
      description: 'Faster neural signaling for quicker muscle activation',
      color: '#8b4513',
    },
  },
  {
    elements: ['HCO₃⁻', 'Lactic Acid'],
    potion: {
      name: 'Lactate Buffer',
      elements: ['HCO₃⁻', 'Lactic Acid'],
      effect: 'HCO₃⁻ neutralizes H⁺ from lactic acid, buffering blood pH',
      stat: 'anaerobic_capacity',
      magnitude: 22,
      description: 'Delays acidosis for extended high-intensity performance',
      color: '#f0e68c',
    },
  },
  {
    elements: ['Mg²⁺', 'ATP'],
    potion: {
      name: 'Enzyme Catalyst',
      elements: ['Mg²⁺', 'ATP'],
      effect: 'Mg²⁺ is a cofactor for ATPase, accelerating ATP hydrolysis',
      stat: 'efficiency',
      magnitude: 15,
      description: 'Optimizes energy conversion efficiency in all systems',
      color: '#98fb98',
    },
  },
  {
    elements: ['Fe', 'Ca²⁺'],
    potion: {
      name: 'Bone Fortifier',
      elements: ['Fe', 'Ca²⁺'],
      effect: 'Calcium strengthens bones; iron supports myoglobin in muscles',
      stat: 'jump_power',
      magnitude: 20,
      description: 'Stronger bones and muscles for powerful jumps',
      color: '#f5f5dc',
    },
  },
  {
    elements: ['N₂', 'O₂'],
    potion: {
      name: 'Altitude Adaptor',
      elements: ['N₂', 'O₂'],
      effect: 'Optimized gas mixture mimics altitude acclimatization (EPO response)',
      stat: 'altitude_resistance',
      magnitude: 20,
      description: 'Improves performance at high altitudes with low oxygen',
      color: '#b0c4de',
    },
  },
  {
    elements: ['C₆H₁₂O₆', 'H₂O'],
    potion: {
      name: 'Glycogen Reserve',
      elements: ['C₆H₁₂O₆', 'H₂O'],
      effect: 'Glucose polymerizes with water into glycogen for energy storage',
      stat: 'stamina',
      magnitude: 18,
      description: 'Extended energy reserves for longer races',
      color: '#daa520',
    },
  },
];

// ============================================================
// MUSCLE EFFECTS ON PERFORMANCE
// ============================================================
export const MUSCLE_EFFECTS = {
  quadriceps: {
    name: 'Quadriceps',
    function: 'Knee extension',
    effect: 'Sprint speed',
    stats: { sprint_speed: 1.3, swim_speed: 1.0, jump_height: 1.05, efficiency: 1.0 },
  },
  hamstrings: {
    name: 'Hamstrings',
    function: 'Hip extension',
    effect: 'Acceleration',
    stats: { sprint_speed: 1.1, swim_speed: 1.0, jump_height: 1.1, efficiency: 1.05 },
  },
  calves: {
    name: 'Calves',
    function: 'Plantar flexion',
    effect: 'Jump height',
    stats: { sprint_speed: 1.05, swim_speed: 1.0, jump_height: 1.35, efficiency: 1.0 },
  },
  core: {
    name: 'Core',
    function: 'Stability',
    effect: 'Efficiency',
    stats: { sprint_speed: 1.05, swim_speed: 1.1, jump_height: 1.05, efficiency: 1.3 },
  },
  upperBody: {
    name: 'Upper Body',
    function: 'Arm propulsion',
    effect: 'Swim speed',
    stats: { sprint_speed: 1.0, swim_speed: 1.35, jump_height: 1.0, efficiency: 1.05 },
  },
};

// ============================================================
// DEFAULT CONFIG
// ============================================================
export const DEFAULT_PLAYER_CONFIG: import('./types').PlayerConfig = {
  muscles: {
    quadriceps: false,
    hamstrings: false,
    calves: false,
    core: false,
    upperBody: false,
  },
  energy: {
    atpPc: 33,
    anaerobic: 34,
    aerobic: 33,
  },
  potions: [],
  mass: 70,
  catapult: {
    angle: 45,
    force: 50,
  },
};
