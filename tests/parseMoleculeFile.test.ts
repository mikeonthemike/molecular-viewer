import { describe, expect, it } from 'vitest';
import { detectMoleculeFormat, parseMoleculeFile } from '../src/parsers/parseMoleculeFile';
import samplePdb from './fixtures/sample.pdb?raw';

describe('parseMoleculeFile', () => {
  it('detects PDB by extension', () => {
    expect(detectMoleculeFormat('protein.pdb', '')).toBe('pdb');
    expect(detectMoleculeFormat('rcsb.ent', '')).toBe('pdb');
  });

  it('detects mmCIF by extension', () => {
    expect(detectMoleculeFormat('structure.cif', '')).toBe('cif');
    expect(detectMoleculeFormat('structure.mmcif', '')).toBe('cif');
  });

  it('detects format from content when extension is missing', () => {
    expect(detectMoleculeFormat('download', samplePdb)).toBe('pdb');
    expect(detectMoleculeFormat('download', 'data_test\n_atom_site.id\n')).toBe('cif');
  });

  it('parses PDB files with atoms', () => {
    const data = parseMoleculeFile('sample.pdb', samplePdb);
    expect(data.atoms.length).toBeGreaterThan(0);
  });

  it('throws a helpful error for structure factor CIF files', () => {
    const sfHead = 'data_r1exrsf\nloop_\n_refln.index_h\n_refln.index_k\n';
    expect(() => parseMoleculeFile('1EXR-sf.cif', sfHead)).toThrow(/structure factor file/i);
    expect(() => parseMoleculeFile('1EXR-sf.cif', sfHead)).toThrow(/1EXR/);
  });
});
