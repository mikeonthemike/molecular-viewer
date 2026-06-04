import type { Atom, Bond, MoleculeData } from './types';
import { buildChains, computeBounds, parseElement } from '../utils/geometryUtils';

interface HelixRecord {
  chainID: string;
  startSeq: number;
  endSeq: number;
}

interface SheetRecord {
  chainID: string;
  startSeq: number;
  endSeq: number;
}

/** Parse PDB format text into MoleculeData (uses MODEL 1 only) */
export function parsePDB(text: string): MoleculeData {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const conectMap = new Map<number, number[]>();
  const helices: HelixRecord[] = [];
  const sheets: SheetRecord[] = [];

  let modelCount = 0;
  let serial = 0;

  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const record = line.substring(0, 6).trim();

    if (record === 'MODEL') {
      modelCount += 1;
      continue;
    }
    if (record === 'ENDMDL' && modelCount === 1) {
      continue;
    }
    if (modelCount > 1) continue;

    if (record === 'ATOM' || record === 'HETATM') {
      const name = line.substring(12, 16).trim();
      const altLoc = line.charAt(16);
      if (altLoc && altLoc !== ' ' && altLoc !== 'A') continue;

      const residueName = line.substring(17, 20).trim();
      const chainID = line.charAt(21) || 'A';
      const residueSeq = parseInt(line.substring(22, 26).trim(), 10) || 0;
      const x = parseFloat(line.substring(30, 38)) || 0;
      const y = parseFloat(line.substring(38, 46)) || 0;
      const z = parseFloat(line.substring(46, 54)) || 0;
      const occupancyStr = line.substring(54, 60).trim();
      const bFactorStr = line.substring(60, 66).trim();
      const elementField = line.length >= 78 ? line.substring(76, 78).trim() : '';

      serial += 1;
      const atom: Atom = {
        serial,
        name,
        element: parseElement(name, elementField),
        residueName,
        chainID,
        residueSeq,
        x,
        y,
        z,
      };

      if (occupancyStr) atom.occupancy = parseFloat(occupancyStr);
      if (bFactorStr) atom.bFactor = parseFloat(bFactorStr);

      atoms.push(atom);
    } else if (record === 'CONECT') {
      const atomSerial = parseInt(line.substring(6, 11).trim(), 10);
      if (!atomSerial) continue;
      const connected: number[] = conectMap.get(atomSerial) ?? [];
      for (let i = 11; i <= 31; i += 5) {
        const target = parseInt(line.substring(i, i + 5).trim(), 10);
        if (target && target !== atomSerial) connected.push(target);
      }
      conectMap.set(atomSerial, connected);
    } else if (record === 'HELIX') {
      const chainID = line.charAt(19) || 'A';
      const startSeq = parseInt(line.substring(21, 25).trim(), 10) || 0;
      const endSeq = parseInt(line.substring(33, 37).trim(), 10) || 0;
      helices.push({ chainID, startSeq, endSeq });
    } else if (record === 'SHEET') {
      const chainID = line.charAt(21) || 'A';
      const startSeq = parseInt(line.substring(22, 26).trim(), 10) || 0;
      const endSeq = parseInt(line.substring(33, 37).trim(), 10) || 0;
      sheets.push({ chainID, startSeq, endSeq });
    }
  }

  // Build bonds from CONECT records
  const seenBonds = new Set<string>();
  for (const [atomA, targets] of conectMap) {
    for (const atomB of targets) {
      const key = atomA < atomB ? `${atomA}-${atomB}` : `${atomB}-${atomA}`;
      if (!seenBonds.has(key)) {
        seenBonds.add(key);
        bonds.push({ atomA, atomB, order: 1 });
      }
    }
  }

  const chains = buildChains(atoms);
  applySecondaryStructureRecords(chains, helices, sheets);
  const { center, boundingRadius } = computeBounds(atoms);

  return {
    atoms,
    bonds,
    chains,
    center,
    boundingRadius,
    hasConectBonds: bonds.length > 0,
  };
}

function applySecondaryStructureRecords(
  chains: MoleculeData['chains'],
  helices: HelixRecord[],
  sheets: SheetRecord[],
): void {
  for (const chain of chains) {
    for (const residue of chain.residues) {
      for (const helix of helices) {
        if (
          helix.chainID === chain.id &&
          residue.seq >= helix.startSeq &&
          residue.seq <= helix.endSeq
        ) {
          residue.secondaryStructure = 'helix';
        }
      }
      for (const sheet of sheets) {
        if (
          sheet.chainID === chain.id &&
          residue.seq >= sheet.startSeq &&
          residue.seq <= sheet.endSeq
        ) {
          residue.secondaryStructure = 'sheet';
        }
      }
      if (!residue.secondaryStructure) {
        residue.secondaryStructure = 'loop';
      }
    }
  }
}
