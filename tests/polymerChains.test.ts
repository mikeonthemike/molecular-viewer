import { describe, expect, it } from 'vitest';
import { fetchRCSBStructure } from '../src/parsers/mmCIFParser';
import { getPolymerChainIds } from '../src/utils/polymerChains';

describe('polymerChains', () => {
  it('identifies two protein chains in 1HHO asymmetric unit', async () => {
    const data = await fetchRCSBStructure('1HHO');
    const polymerIds = getPolymerChainIds(data);
    expect(polymerIds).toEqual(['A', 'B']);
    expect(data.chains.length).toBeGreaterThan(polymerIds.length);
  });
});
