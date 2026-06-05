import type { TourAssemblyContext } from '../parsers/types';
import {
  formatStructureInventory,
  type StructureInventory,
} from './structureInventory';

export interface TourAuthoringSuggestions {
  expectedPolymerChainCount: number;
  visibleChains: string[];
  assemblyContext: TourAssemblyContext;
  /** Human-readable note for tour prose (e.g. ligand asym units vs biological assembly) */
  assemblyNote: string;
}

/** Derive tour metadata fields from a parsed structure inventory */
export function getTourAuthoringSuggestions(
  inventory: StructureInventory,
): TourAuthoringSuggestions {
  const visibleChains = [...inventory.polymerChainIds];
  const ligandCount = inventory.ligandChains.length;

  let assemblyNote: string;
  if (ligandCount > 0) {
    assemblyNote =
      `RCSB default fetch is the asymmetric unit (${visibleChains.length} polymer chain(s); ` +
      `${ligandCount} ligand asym unit(s) listed separately). Set visibleChains on each step to hide ligands.`;
  } else if (visibleChains.length === 1) {
    assemblyNote =
      'Single polymer chain in the asymmetric unit. Confirm whether tour prose should reference a biological assembly.';
  } else {
    assemblyNote =
      'Polymer chains only in the asymmetric unit. Confirm copy matches what students will see.';
  }

  return {
    expectedPolymerChainCount: inventory.polymerChains.length,
    visibleChains,
    assemblyContext: 'asymmetric-unit',
    assemblyNote,
  };
}

/** Full printable report for CLI and agent workflows */
export function formatTourAuthoringReport(inventory: StructureInventory): string {
  const suggestions = getTourAuthoringSuggestions(inventory);
  const visibleChainsLiteral = JSON.stringify(suggestions.visibleChains);

  const polymerLines = inventory.polymerChains.map(
    (c) => `  ${c.id} — ${c.caCount} Cα, ${c.residueCount} residues`,
  );
  const ligandIds = inventory.ligandChains.map((c) => c.id).join(', ') || 'none';

  return [
    `=== ${inventory.accession} — tour authoring report ===`,
    '',
    'Structure inventory (RCSB asymmetric unit)',
    '------------------------------------------',
    `Polymer chains (${inventory.polymerChains.length}):`,
    ...(polymerLines.length > 0 ? polymerLines : ['  (none)']),
    `Ligand / small-molecule asym units (${inventory.ligandChains.length}): ${ligandIds}`,
    formatStructureInventory(inventory),
    '',
    'Suggested tour metadata (paste into src/data/tours.ts)',
    '------------------------------------------------------',
    `expectedPolymerChainCount: ${suggestions.expectedPolymerChainCount},`,
    `assemblyContext: '${suggestions.assemblyContext}',`,
    `// ${suggestions.assemblyNote}`,
    '',
    'Per-step visibleChains (polymer only — hides ligand asym units):',
    `  visibleChains: ${visibleChainsLiteral},`,
    '',
    'Camera authoring',
    '----------------',
    'Load the structure in the viewer, orbit to each step view, then in DevTools:',
    '  viewerRef.current?.logCameraState()',
    'Copy cameraPositionScale and cameraTargetScale into each TourStep.',
    '',
    'Validate when done',
    '------------------',
    '  npm run validate-tours',
  ].join('\n');
}
