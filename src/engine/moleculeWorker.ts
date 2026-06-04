import type { MoleculeResult, MoleculeTask } from '../parsers/types';
import { calculateBonds } from './BondCalculator';
import { analyseSecondaryStructure, flattenResidues } from './StructureAnalyser';
import { SpatialIndex } from './SpatialIndex';

self.onmessage = (event: MessageEvent<MoleculeTask>) => {
  const task = event.data;

  if (task.type === 'process') {
    try {
      let bonds = task.bonds;
      if (!task.hasConectBonds || bonds.length === 0) {
        bonds = calculateBonds(task.atoms);
        self.postMessage({ type: 'bonds', bonds } satisfies MoleculeResult);
      } else {
        self.postMessage({ type: 'bonds', bonds } satisfies MoleculeResult);
      }

      const residues = flattenResiduesFromAtoms(task.atoms);
      const annotated = analyseSecondaryStructure(task.atoms, residues);
      self.postMessage({ type: 'secondaryStructure', residues: annotated } satisfies MoleculeResult);

      const index = new SpatialIndex();
      index.build(task.atoms);
      self.postMessage({ type: 'spatialIndex', ready: true } satisfies MoleculeResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Worker processing failed';
      self.postMessage({ type: 'error', message } satisfies MoleculeResult);
    }
  }
};

function flattenResiduesFromAtoms(atoms: MoleculeTask['atoms']) {
  const residueMap = new Map<string, ReturnType<typeof flattenResidues>[0]>();

  for (const atom of atoms) {
    const key = `${atom.chainID}:${atom.residueSeq}`;
    let residue = residueMap.get(key);
    if (!residue) {
      residue = {
        seq: atom.residueSeq,
        name: atom.residueName,
        chainID: atom.chainID,
        atoms: [],
        secondaryStructure: 'loop',
      };
      residueMap.set(key, residue);
    }
    residue.atoms.push(atom.serial);
  }

  return [...residueMap.values()];
}

export {};
