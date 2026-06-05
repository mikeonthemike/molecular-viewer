import type { Atom, Chain, MoleculeData } from '../parsers/types';

/** Count Cα atoms in a chain — ribbon-quality polymer chains need several */
export function countCaAtoms(chain: Chain, atoms: Atom[]): number {
  let count = 0;
  for (const residue of chain.residues) {
    for (const serial of residue.atoms) {
      const atom = atoms.find((a) => a.serial === serial);
      if (atom?.name.trim() === 'CA') count += 1;
    }
  }
  return count;
}

/** Protein/nucleic polymer chains — excludes short ligand asym units (heme, ions, etc.) */
export function getPolymerChainIds(data: MoleculeData, minCa = 4): string[] {
  return data.chains
    .filter((chain) => countCaAtoms(chain, data.atoms) >= minCa)
    .map((chain) => chain.id);
}

export function isPolymerChain(chain: Chain, atoms: Atom[], minCa = 4): boolean {
  return countCaAtoms(chain, atoms) >= minCa;
}
