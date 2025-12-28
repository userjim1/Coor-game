export type LigandType = 'NH3' | 'Cl';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SlotData {
  id: number;
  position: Vector3;
}

export type LigandMap = Record<number, LigandType>;

export type IsomerTarget = 'CIS' | 'TRANS' | 'FAC' | 'MER';
export type ViewMode = '3D' | '2D';
export type GameState = 'START' | 'GUIDE' | 'PLAYING' | 'COMPLETED';

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  formula: string;
  target: IsomerTarget;
  requiredCl: number;
  requiredNH3: number;
}

export interface CheckResult {
  type: 'success' | 'error' | 'info';
  message: string;
  isomerType?: IsomerTarget;
}