/**
 * CLI helper for guided-tour authoring: fetches an RCSB structure and prints
 * chain inventory plus suggested tour metadata (visibleChains, assemblyContext).
 *
 * Usage: npm run inspect-structure -- 1HHO
 */
import { fetchRCSBStructure } from '../src/parsers/mmCIFParser';
import { getStructureInventory } from '../src/utils/structureInventory';
import { formatTourAuthoringReport } from '../src/utils/tourAuthoringReport';

const accession = process.argv[2]?.trim().toUpperCase();

if (!accession || !/^[A-Z0-9]{4}$/.test(accession)) {
  console.error('Usage: npm run inspect-structure -- <ACCESSION>');
  console.error('Example: npm run inspect-structure -- 1HHO');
  process.exit(1);
}

try {
  const data = await fetchRCSBStructure(accession);
  const inventory = getStructureInventory(accession, data);
  console.log(formatTourAuthoringReport(inventory));
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Failed to inspect ${accession}: ${message}`);
  process.exit(1);
}
