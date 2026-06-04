import type { Atom, Bond } from '../parsers/types';
import { BOND_THRESHOLDS, DEFAULT_BOND_THRESHOLD } from '../utils/constants';
import { normalizeElement } from '../utils/geometryUtils';
import { SpatialIndex } from './SpatialIndex';

function bondThreshold(elA: string, elB: string): number {
  const a = normalizeElement(elA);
  const b = normalizeElement(elB);
  const key1 = `${a}-${b}`;
  const key2 = `${b}-${a}`;
  return BOND_THRESHOLDS[key1] ?? BOND_THRESHOLDS[key2] ?? DEFAULT_BOND_THRESHOLD;
}

/** Calculate covalent bonds using k-d tree spatial indexing */
export function calculateBonds(atoms: Atom[]): Bond[] {
  if (atoms.length === 0) return [];

  const index = new SpatialIndex();
  index.build(atoms);

  const bonds: Bond[] = [];
  const seen = new Set<string>();
  const maxThreshold = Math.max(...Object.values(BOND_THRESHOLDS), DEFAULT_BOND_THRESHOLD) + 0.5;

  for (const atom of atoms) {
    const threshold = bondThreshold(atom.element, atom.element);
    const searchRadius = threshold + 0.3;
    const neighbours = index.queryRadius(atom.x, atom.y, atom.z, searchRadius, atoms);

    for (const neighbourIdx of neighbours) {
      const other = atoms[neighbourIdx];
      if (!other || other.serial <= atom.serial) continue;

      const pairThreshold = bondThreshold(atom.element, other.element);
      const dx = atom.x - other.x;
      const dy = atom.y - other.y;
      const dz = atom.z - other.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= pairThreshold && dist <= maxThreshold) {
        const key = `${atom.serial}-${other.serial}`;
        if (!seen.has(key)) {
          seen.add(key);
          bonds.push({ atomA: atom.serial, atomB: other.serial, order: 1 });
        }
      }
    }
  }

  return bonds;
}
