export interface Atom {
  serial: number;
  name: string;
  element: string;
  residueName: string;
  chainID: string;
  residueSeq: number;
  x: number;
  y: number;
  z: number;
  bFactor?: number;
  occupancy?: number;
}

export interface Bond {
  atomA: number;
  atomB: number;
  order: 1 | 2 | 3;
}

export interface Residue {
  seq: number;
  name: string;
  chainID: string;
  atoms: number[];
  secondaryStructure?: 'helix' | 'sheet' | 'loop';
}

export interface Chain {
  id: string;
  residues: Residue[];
}

export interface MoleculeData {
  atoms: Atom[];
  bonds: Bond[];
  chains: Chain[];
  center: [number, number, number];
  boundingRadius: number;
  /** True when bonds were parsed from CONECT records */
  hasConectBonds?: boolean;
}

export type RepresentationMode =
  | 'ball-and-stick'
  | 'space-filling'
  | 'ribbon'
  | 'backbone';

export type ColorScheme =
  | 'element'
  | 'chain'
  | 'residueType'
  | 'bFactor'
  | 'secondaryStructure';

export interface Measurement {
  id: string;
  atomA: Atom;
  atomB: Atom;
  distance: number;
}

export type MoleculeTask = { type: 'process'; atoms: Atom[]; bonds: Bond[]; hasConectBonds: boolean };

export type MoleculeResult =
  | { type: 'bonds'; bonds: Bond[] }
  | { type: 'secondaryStructure'; residues: Residue[] }
  | { type: 'spatialIndex'; ready: true }
  | { type: 'error'; message: string };

export type StructureCategory =
  | 'enzyme'
  | 'receptor'
  | 'antibody'
  | 'virus'
  | 'dna-rna'
  | 'structural'
  | 'hormone'
  | 'transport';

export interface LibraryEntry {
  id: string;
  accession: string;
  name: string;
  organism: string;
  category: StructureCategory;
  tags: string[];
  description: string;
  atomCount: number;
  resolution: number;
  year: number;
  defaultRepresentation: RepresentationMode;
  defaultColorScheme: ColorScheme;
  highlightResidues?: number[];
}

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** World-space camera position (used when scale fields are omitted) */
  cameraPosition: [number, number, number];
  /** World-space orbit target */
  cameraTarget: [number, number, number];
  /** Portable camera offset from center in units of boundingRadius */
  cameraPositionScale?: [number, number, number];
  cameraTargetScale?: [number, number, number];
  highlightResidues: number[];
  highlightChains?: string[];
  /** Restrict visible chains for this step (e.g. hide ligand asym units) */
  visibleChains?: string[];
  representation?: RepresentationMode;
  colorScheme?: ColorScheme;
}

/** What the linked RCSB deposit actually contains — used by tour validation */
export type TourAssemblyContext = 'asymmetric-unit' | 'biological-assembly';

export interface Tour {
  id: string;
  structureId: string;
  title: string;
  audience: 'general' | 'undergraduate' | 'advanced';
  estimatedMinutes: number;
  /** Polymer chains expected after parsing — must match RCSB deposit */
  expectedPolymerChainCount?: number;
  /** Clarifies whether tour copy should reference full biological assembly */
  assemblyContext?: TourAssemblyContext;
  steps: TourStep[];
}

export interface SavedViewerState {
  representation: RepresentationMode;
  colorScheme: ColorScheme;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  visibleChains: string[];
}
