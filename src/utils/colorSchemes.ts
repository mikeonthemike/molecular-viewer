import type { Atom, ColorScheme } from '../parsers/types';

/** CPK element colours */
const CPK: Record<string, string> = {
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  H: '#FFFFFF',
  S: '#FFFF30',
  P: '#FF8000',
  F: '#90E050',
  CL: '#1FF01F',
  BR: '#A62929',
  I: '#940094',
  FE: '#E06633',
  ZN: '#7D80B0',
  MG: '#8AFF00',
  CA: '#3DFF00',
  NA: '#AB5CF2',
  K: '#8F40CF',
};

/** Eight distinct hues for chain colouring */
const CHAIN_PALETTE = [
  '#E6194B',
  '#3CB44B',
  '#4363D8',
  '#F58231',
  '#911EB4',
  '#42D4F4',
  '#F032E6',
  '#BFEF45',
];

const HYDROPHOBIC = new Set([
  'ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TRP', 'PRO', 'GLY', 'CYS',
]);
const POLAR = new Set(['SER', 'THR', 'ASN', 'GLN', 'TYR', 'HIS']);
const POSITIVE = new Set(['LYS', 'ARG']);
const NEGATIVE = new Set(['ASP', 'GLU']);
const SPECIAL = new Set(['SEC', 'PYL']);

const SECONDARY_COLORS = {
  helix: '#FF00FF',
  sheet: '#FFFF00',
  loop: '#FFFFFF',
};

function hashChain(chainID: string): number {
  let hash = 0;
  for (let i = 0; i < chainID.length; i += 1) {
    hash = (hash * 31 + chainID.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Residue-type classification colour */
function residueTypeColor(residueName: string): string {
  const r = residueName.toUpperCase();
  if (HYDROPHOBIC.has(r)) return '#FFFFFF';
  if (POLAR.has(r)) return '#00FF00';
  if (POSITIVE.has(r)) return '#3050F8';
  if (NEGATIVE.has(r)) return '#FF0D0D';
  if (SPECIAL.has(r)) return '#FFFF00';
  return '#CCCCCC';
}

/** B-factor gradient: blue (low) → white → red (high) */
function bFactorColor(bFactor: number, min: number, max: number): string {
  const range = max - min || 1;
  const t = Math.max(0, Math.min(1, (bFactor - min) / range));

  if (t < 0.5) {
    const u = t * 2;
    const r = Math.round(48 + u * (255 - 48));
    const g = Math.round(80 + u * (255 - 80));
    const b = 255;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  const u = (t - 0.5) * 2;
  const r = 255;
  const g = Math.round(255 - u * 255);
  const b = Math.round(255 - u * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function getElementColor(element: string): string {
  const key = element.toUpperCase();
  return CPK[key] ?? '#FF1493';
}

/** Distinct hue for a polymer chain — used by ribbon and backbone renderers */
export function getChainColor(chainID: string): string {
  return CHAIN_PALETTE[hashChain(chainID) % CHAIN_PALETTE.length]!;
}

export function getAtomColor(
  atom: Atom,
  scheme: ColorScheme,
  context?: {
    bFactorRange?: [number, number];
    secondaryStructure?: 'helix' | 'sheet' | 'loop';
  },
): string {
  switch (scheme) {
    case 'element':
      return getElementColor(atom.element);
    case 'chain':
      return CHAIN_PALETTE[hashChain(atom.chainID) % CHAIN_PALETTE.length]!;
    case 'residueType':
      return residueTypeColor(atom.residueName);
    case 'bFactor': {
      const bf = atom.bFactor ?? 0;
      const [min, max] = context?.bFactorRange ?? [0, 100];
      return bFactorColor(bf, min, max);
    }
    case 'secondaryStructure': {
      const ss = context?.secondaryStructure ?? 'loop';
      return SECONDARY_COLORS[ss];
    }
    default:
      return getElementColor(atom.element);
  }
}

export function computeBFactorRange(atoms: Atom[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const atom of atoms) {
    const bf = atom.bFactor ?? 0;
    if (bf < min) min = bf;
    if (bf > max) max = bf;
  }
  if (!Number.isFinite(min)) return [0, 100];
  return [min, max];
}

export type { ColorScheme };
