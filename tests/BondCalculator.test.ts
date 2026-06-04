import { describe, expect, it } from 'vitest';
import { calculateBonds } from '../src/engine/BondCalculator';
import type { Atom } from '../src/parsers/types';

/** Minimal alanine dipeptide-like backbone fragment */
const alanineDipeptide: Atom[] = [
  { serial: 1, name: 'N', element: 'N', residueName: 'ALA', chainID: 'A', residueSeq: 1, x: 0, y: 0, z: 0 },
  { serial: 2, name: 'CA', element: 'C', residueName: 'ALA', chainID: 'A', residueSeq: 1, x: 1.46, y: 0, z: 0 },
  { serial: 3, name: 'C', element: 'C', residueName: 'ALA', chainID: 'A', residueSeq: 1, x: 2.01, y: 1.42, z: 0 },
  { serial: 4, name: 'O', element: 'O', residueName: 'ALA', chainID: 'A', residueSeq: 1, x: 1.36, y: 2.45, z: 0 },
  { serial: 5, name: 'CB', element: 'C', residueName: 'ALA', chainID: 'A', residueSeq: 1, x: 2.05, y: -0.67, z: 1.2 },
  { serial: 6, name: 'N', element: 'N', residueName: 'GLY', chainID: 'A', residueSeq: 2, x: 3.32, y: 1.45, z: 0 },
];

describe('BondCalculator', () => {
  it('finds covalent bonds for alanine dipeptide fragment', () => {
    const bonds = calculateBonds(alanineDipeptide);
    expect(bonds.length).toBeGreaterThanOrEqual(5);
    expect(bonds.length).toBeLessThanOrEqual(8);
  });
});
