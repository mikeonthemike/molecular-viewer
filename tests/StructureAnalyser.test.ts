import { describe, expect, it } from 'vitest';
import { analyseSecondaryStructure, flattenResidues } from '../src/engine/StructureAnalyser';
import { fetchRCSBStructure } from '../src/parsers/mmCIFParser';

describe('StructureAnalyser', () => {
  it('assigns helix and sheet segments to lysozyme', async () => {
    const data = await fetchRCSBStructure('1LYZ');
    const annotated = analyseSecondaryStructure(data.atoms, flattenResidues(data.chains));

    const helix = annotated.filter((r) => r.secondaryStructure === 'helix').length;
    const sheet = annotated.filter((r) => r.secondaryStructure === 'sheet').length;

    expect(helix).toBeGreaterThan(10);
    expect(sheet).toBeGreaterThan(0);
  });
});
