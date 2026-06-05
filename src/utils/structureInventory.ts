import type { MoleculeData } from '../parsers/types';
import { countCaAtoms, getPolymerChainIds } from './polymerChains';

export interface ChainInventoryEntry {
  id: string;
  residueCount: number;
  caCount: number;
}

export interface StructureInventory {
  accession: string;
  center: [number, number, number];
  boundingRadius: number;
  polymerChains: ChainInventoryEntry[];
  ligandChains: ChainInventoryEntry[];
  polymerChainIds: string[];
}

/** Summarise parsed structure content for tour authoring and validation */
export function getStructureInventory(
  accession: string,
  data: MoleculeData,
): StructureInventory {
  const polymerChainIds = getPolymerChainIds(data);
  const polymerSet = new Set(polymerChainIds);

  const polymerChains: ChainInventoryEntry[] = [];
  const ligandChains: ChainInventoryEntry[] = [];

  for (const chain of data.chains) {
    const entry: ChainInventoryEntry = {
      id: chain.id,
      residueCount: chain.residues.length,
      caCount: countCaAtoms(chain, data.atoms),
    };
    if (polymerSet.has(chain.id)) {
      polymerChains.push(entry);
    } else {
      ligandChains.push(entry);
    }
  }

  return {
    accession,
    center: data.center,
    boundingRadius: data.boundingRadius,
    polymerChains,
    ligandChains,
    polymerChainIds,
  };
}

/** Pretty-print inventory for tour authoring (browser console or CI logs) */
export function formatStructureInventory(inventory: StructureInventory): string {
  const polymer = inventory.polymerChains
    .map((c) => `${c.id} (${c.caCount} Cα, ${c.residueCount} residues)`)
    .join(', ');
  const ligands = inventory.ligandChains.map((c) => c.id).join(', ') || 'none';
  return [
    `${inventory.accession}: ${inventory.polymerChains.length} polymer chain(s) [${polymer}]`,
    `ligand asym units: ${ligands}`,
    `center: [${inventory.center.map((n) => n.toFixed(1)).join(', ')}], radius: ${inventory.boundingRadius.toFixed(1)}`,
  ].join('\n');
}
