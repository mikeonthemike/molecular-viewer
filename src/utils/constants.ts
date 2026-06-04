/** Van der Waals radii in Ångströms (CPK-style) */
export const VDW_RADII: Record<string, number> = {
  H: 1.2,
  C: 1.7,
  N: 1.55,
  O: 1.52,
  S: 1.8,
  P: 1.8,
  F: 1.47,
  CL: 1.75,
  BR: 1.85,
  I: 1.98,
  FE: 2.0,
  ZN: 1.39,
  MG: 1.73,
  CA: 2.31,
  NA: 2.27,
  K: 2.75,
};

/** Covalent bond distance thresholds by element pair (Å) */
export const BOND_THRESHOLDS: Record<string, number> = {
  'H-H': 0.85,
  'H-C': 1.15,
  'H-N': 1.05,
  'H-O': 1.05,
  'H-S': 1.35,
  'C-C': 1.65,
  'C-N': 1.55,
  'C-O': 1.45,
  'C-S': 1.85,
  'N-N': 1.55,
  'N-O': 1.45,
  'O-O': 1.55,
  'S-S': 2.1,
  'P-O': 1.75,
  'P-C': 1.95,
};

export const DEFAULT_BOND_THRESHOLD = 1.9;

/** Display sphere radius for ball-and-stick (Å) */
export const ATOM_DISPLAY_RADIUS = 0.3;

/** LOD distance thresholds (Å from molecule center, scaled by bounding radius) */
export const LOD_NEAR = 40;
export const LOD_MID = 120;

/** RCSB PDB download URL template */
export const RCSB_CIF_URL = 'https://files.rcsb.org/download/{id}.cif';

/** Accession code pattern: 4 alphanumeric characters */
export const ACCESSION_PATTERN = /^[A-Za-z0-9]{4}$/;
