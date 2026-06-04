import type { Atom, MoleculeData } from '../parsers/types';

/** Compute center of mass and bounding radius for a set of atoms */
export function computeBounds(atoms: Atom[]): {
  center: [number, number, number];
  boundingRadius: number;
} {
  if (atoms.length === 0) {
    return { center: [0, 0, 0], boundingRadius: 10 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (const atom of atoms) {
    sumX += atom.x;
    sumY += atom.y;
    sumZ += atom.z;
  }

  const n = atoms.length;
  const center: [number, number, number] = [sumX / n, sumY / n, sumZ / n];

  let maxDistSq = 0;
  for (const atom of atoms) {
    const dx = atom.x - center[0];
    const dy = atom.y - center[1];
    const dz = atom.z - center[2];
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq > maxDistSq) maxDistSq = distSq;
  }

  return { center, boundingRadius: Math.sqrt(maxDistSq) || 10 };
}

/** Euclidean distance between two atoms in Å */
export function atomDistance(a: Atom, b: Atom): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Build chain/residue hierarchy from flat atom list */
export function buildChains(atoms: Atom[]): MoleculeData['chains'] {
  const chainMap = new Map<string, Map<number, { name: string; atoms: number[] }>>();

  for (const atom of atoms) {
    let chain = chainMap.get(atom.chainID);
    if (!chain) {
      chain = new Map();
      chainMap.set(atom.chainID, chain);
    }

    let residue = chain.get(atom.residueSeq);
    if (!residue) {
      residue = { name: atom.residueName, atoms: [] };
      chain.set(atom.residueSeq, residue);
    }
    residue.atoms.push(atom.serial);
  }

  const chains: MoleculeData['chains'] = [];
  for (const [id, residueMap] of chainMap) {
    const residues = [...residueMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([seq, data]) => ({
        seq,
        name: data.name,
        chainID: id,
        atoms: data.atoms,
      }));
    chains.push({ id, residues });
  }

  return chains.sort((a, b) => a.id.localeCompare(b.id));
}

/** Extract element symbol from atom name (handles PDB quirks) */
export function parseElement(atomName: string, elementField?: string): string {
  if (elementField && elementField.trim()) {
    return elementField.trim().charAt(0).toUpperCase() + elementField.trim().slice(1).toLowerCase();
  }

  const trimmed = atomName.trim();
  if (trimmed.length >= 2 && trimmed.charAt(1) === trimmed.charAt(1).toLowerCase()) {
    return trimmed.slice(0, 2).charAt(0).toUpperCase() + trimmed.slice(1, 2).toLowerCase();
  }
  return trimmed.charAt(0).toUpperCase();
}

/** Normalize element to uppercase single/double char */
export function normalizeElement(element: string): string {
  const e = element.trim();
  if (e.length <= 1) return e.toUpperCase();
  return e.charAt(0).toUpperCase() + e.slice(1).toLowerCase();
}
