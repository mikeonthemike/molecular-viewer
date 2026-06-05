import { describe, expect, it } from 'vitest';
import { fetchRCSBStructure } from '../src/parsers/mmCIFParser';
import { TOURS } from '../src/data/tours';
import {
  formatStructureInventory,
  getStructureInventory,
} from '../src/utils/structureInventory';
import {
  formatValidationReport,
  validateTourAgainstData,
} from '../src/utils/validateTour';

describe('validateTour', () => {
  it('validates all tours against live RCSB structures', async () => {
    const structureIds = [...new Set(TOURS.map((t) => t.structureId))];
    const allIssues = [];

    for (const structureId of structureIds) {
      const data = await fetchRCSBStructure(structureId);
      const inventory = getStructureInventory(structureId, data);
      // Helpful when authoring new tours — inventory printed on failure
      const inventorySummary = formatStructureInventory(inventory);

      for (const tour of TOURS.filter((t) => t.structureId === structureId)) {
        const issues = validateTourAgainstData(tour, data);
        const errors = issues.filter((i) => i.severity === 'error');
        if (errors.length > 0) {
          console.error(`\n${inventorySummary}\n${formatValidationReport(errors)}`);
        }
        allIssues.push(...errors);
      }
    }

    expect(allIssues, formatValidationReport(allIssues)).toEqual([]);
  });

  it('documents 1HHO inventory for tour authors', async () => {
    const data = await fetchRCSBStructure('1HHO');
    const inventory = getStructureInventory('1HHO', data);
    expect(inventory.polymerChainIds).toEqual(['A', 'B']);
    expect(inventory.ligandChains.length).toBeGreaterThan(0);
    expect(formatStructureInventory(inventory)).toContain('2 polymer chain');
  });
});
