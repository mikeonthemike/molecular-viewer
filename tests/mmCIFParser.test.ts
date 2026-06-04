import { describe, expect, it } from 'vitest';
import { parsePDB } from '../src/parsers/PDBParser';
import { parseMMCIF } from '../src/parsers/mmCIFParser';
import samplePdb from './fixtures/sample.pdb?raw';

const sampleCif = `
data_test
loop_
_atom_site.group_PDB
_atom_site.id
_atom_site.type_symbol
_atom_site.label_atom_id
_atom_site.label_comp_id
_atom_site.label_asym_id
_atom_site.label_seq_id
_atom_site.Cartn_x
_atom_site.Cartn_y
_atom_site.Cartn_z
ATOM 1 N N THR A 1 17.047 14.099 3.625
ATOM 2 C CA THR A 1 16.967 12.784 4.338
ATOM 3 C C THR A 1 15.685 12.755 5.133
ATOM 4 O O THR A 1 15.268 13.825 5.593
`;

describe('mmCIFParser', () => {
  it('parses _atom_site loop', () => {
    const data = parseMMCIF(sampleCif);
    expect(data.atoms.length).toBe(4);
    expect(data.atoms[0]?.element).toBe('N');
  });

  it('produces coordinates matching PDB parse within tolerance', () => {
    const pdb = parsePDB(samplePdb);
    const cif = parseMMCIF(sampleCif);

    expect(cif.atoms[0]?.x).toBeCloseTo(pdb.atoms[0]!.x, 3);
    expect(cif.atoms[0]?.y).toBeCloseTo(pdb.atoms[0]!.y, 3);
    expect(cif.atoms[0]?.z).toBeCloseTo(pdb.atoms[0]!.z, 3);
  });
});
