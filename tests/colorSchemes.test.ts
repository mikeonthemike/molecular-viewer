import { describe, expect, it } from 'vitest';
import { getAtomColor, getChainColor, getElementColor } from '../src/utils/colorSchemes';
import type { Atom } from '../src/parsers/types';

const sampleAtom: Atom = {
  serial: 1,
  name: 'CA',
  element: 'C',
  residueName: 'ALA',
  chainID: 'A',
  residueSeq: 1,
  x: 0,
  y: 0,
  z: 0,
};

describe('colorSchemes', () => {
  it('returns valid hex for all common elements', () => {
    for (const el of ['C', 'N', 'O', 'H', 'S', 'P', 'FE', 'ZN']) {
      const color = getElementColor(el);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('assigns distinct colours to different chains', () => {
    const colorA = getChainColor('A');
    const colorB = getChainColor('B');
    expect(colorA).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colorB).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colorA).not.toBe(colorB);
  });

  it('returns valid hex for all color schemes', () => {
    const schemes = ['element', 'chain', 'residueType', 'bFactor', 'secondaryStructure'] as const;
    for (const scheme of schemes) {
      const color = getAtomColor(sampleAtom, scheme, {
        bFactorRange: [0, 100],
        secondaryStructure: 'helix',
      });
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
