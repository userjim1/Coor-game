import { Vector3, SlotData, LevelConfig, IsomerTarget, LigandType } from './types';

export const BOND_LENGTH = 2.5;
export const ATOM_SCALE = 0.65;

export const SLOT_DIRECTIONS: Vector3[] = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

export const SLOTS: SlotData[] = SLOT_DIRECTIONS.map((dir, index) => ({
  id: index,
  position: dir,
}));

export const COLORS = {
  NH3: 0x3B82F6,      // Vivid Blue
  Cl: 0x10B981,       // Emerald Green
  Metal: 0xF8FAFC,    // Platinum
  Bond: 0x64748B,     // Cool Grey
  Background: 0x0B1121, // Deep Space
  Ghost: 0x334155,
  Highlight: 0x6366f1 
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Cis-Isomerism",
    description: "Create a structure where the two Chlorines are adjacent (90° apart).",
    formula: "[M(NH₃)₄Cl₂]",
    target: 'CIS',
    requiredCl: 2,
    requiredNH3: 4
  },
  {
    id: 2,
    name: "Trans-Isomerism",
    description: "Create a structure where the two Chlorines are opposite (180° apart).",
    formula: "[M(NH₃)₄Cl₂]",
    target: 'TRANS',
    requiredCl: 2,
    requiredNH3: 4
  },
  {
    id: 3,
    name: "Facial (Fac) Isomerism",
    description: "Arrange 3 Chlorines on one 'face' of the octahedron (all 90° to each other).",
    formula: "[M(NH₃)₃Cl₃]",
    target: 'FAC',
    requiredCl: 3,
    requiredNH3: 3
  },
  {
    id: 4,
    name: "Meridional (Mer) Isomerism",
    description: "Arrange 3 Chlorines along a 'meridian' (plane) of the octahedron.",
    formula: "[M(NH₃)₃Cl₃]",
    target: 'MER',
    requiredCl: 3,
    requiredNH3: 3
  }
];

// Example solutions for the "Show Answer" feature
export const SOLUTIONS: Record<IsomerTarget, Record<number, LigandType>> = {
  CIS: {
    0: 'Cl', 2: 'Cl', // 90 deg
    1: 'NH3', 3: 'NH3', 4: 'NH3', 5: 'NH3'
  },
  TRANS: {
    0: 'Cl', 1: 'Cl', // 180 deg
    2: 'NH3', 3: 'NH3', 4: 'NH3', 5: 'NH3'
  },
  FAC: {
    0: 'Cl', 2: 'Cl', 4: 'Cl', // Right, Top, Front (Face corner)
    1: 'NH3', 3: 'NH3', 5: 'NH3'
  },
  MER: {
    0: 'Cl', 1: 'Cl', 2: 'Cl', // Right, Left, Top (T-shape/Meridian)
    3: 'NH3', 4: 'NH3', 5: 'NH3'
  }
};