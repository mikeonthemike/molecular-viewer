import { describe, expect, it } from 'vitest';
import { fetchRCSBStructure } from '../src/parsers/mmCIFParser';
import { getStructureInventory } from '../src/utils/structureInventory';
import {
  formatTourAuthoringReport,
  getTourAuthoringSuggestions,
} from '../src/utils/tourAuthoringReport';

describe('tourAuthoringReport', () => {
  it('suggests polymer visibleChains for 1HHO', async () => {
    const data = await fetchRCSBStructure('1HHO');
    const inventory = getStructureInventory('1HHO', data);
    const suggestions = getTourAuthoringSuggestions(inventory);

    expect(suggestions.expectedPolymerChainCount).toBe(2);
    expect(suggestions.visibleChains).toEqual(['A', 'B']);
    expect(suggestions.assemblyContext).toBe('asymmetric-unit');
  });

  it('formats a report with metadata snippets', async () => {
    const data = await fetchRCSBStructure('1HHO');
    const inventory = getStructureInventory('1HHO', data);
    const report = formatTourAuthoringReport(inventory);

    expect(report).toContain('=== 1HHO — tour authoring report ===');
    expect(report).toContain('expectedPolymerChainCount: 2,');
    expect(report).toContain(`visibleChains: ${JSON.stringify(['A', 'B'])},`);
    expect(report).toContain('npm run validate-tours');
  });
});
