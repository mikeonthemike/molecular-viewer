import { describe, expect, it } from 'vitest';
import { parsePDB } from '../src/parsers/PDBParser';
import samplePdb from './fixtures/sample.pdb?raw';

describe('PDBParser', () => {
  it('parses ATOM records without throwing', () => {
    const data = parsePDB(samplePdb);
    expect(data.atoms.length).toBeGreaterThan(0);
    expect(data.chains.length).toBeGreaterThan(0);
  });

  it('extracts correct element symbols', () => {
    const data = parsePDB(samplePdb);
    const elements = new Set(data.atoms.map((a) => a.element));
    expect(elements.has('N')).toBe(true);
    expect(elements.has('C')).toBe(true);
    expect(elements.has('O')).toBe(true);
  });

  it('computes center of mass within tolerance', () => {
    const data = parsePDB(samplePdb);
    expect(data.center[0]).toBeCloseTo(16, 0);
    expect(data.boundingRadius).toBeGreaterThan(0);
  });
});
