import type { Atom, Residue } from '../parsers/types';

const HELIX_MIN = -90;
const HELIX_MAX = -30;
const SHEET_MIN = -180;
const SHEET_MAX = -60;

/** Assign secondary structure using simplified DSSP dihedral heuristic */
export function analyseSecondaryStructure(atoms: Atom[], residues: Residue[]): Residue[] {
  const atomBySerial = new Map<number, Atom>();
  for (const atom of atoms) {
    atomBySerial.set(atom.serial, atom);
  }

  return residues.map((residue, index) => {
    if (residue.secondaryStructure && residue.secondaryStructure !== 'loop') {
      return { ...residue };
    }

    const ca = findAtom(residue, atomBySerial, 'CA');
    const n = findAtom(residue, atomBySerial, 'N');
    const c = findAtom(residue, atomBySerial, 'C');

    if (!ca || !n || !c) {
      return { ...residue, secondaryStructure: 'loop' as const };
    }

    // Phi/psi need the previous residue's C and the next residue's N on the same chain
    const prevResidue =
      index > 0 && residues[index - 1]!.chainID === residue.chainID
        ? residues[index - 1]
        : null;
    const nextResidue =
      index < residues.length - 1 && residues[index + 1]!.chainID === residue.chainID
        ? residues[index + 1]
        : null;
    const prevC = prevResidue ? findAtom(prevResidue, atomBySerial, 'C') : null;
    const nextN = nextResidue ? findAtom(nextResidue, atomBySerial, 'N') : null;

    const phi = dihedral(prevC, n, ca, c);
    const psi = dihedral(n, ca, c, nextN);

    let ss: 'helix' | 'sheet' | 'loop' = 'loop';

    if (phi !== null && psi !== null) {
      const avg = (phi + psi) / 2;
      if (avg >= HELIX_MIN && avg <= HELIX_MAX) {
        ss = 'helix';
      } else if (avg >= SHEET_MIN && avg <= SHEET_MAX) {
        ss = 'sheet';
      }
    }

    return { ...residue, secondaryStructure: ss };
  });
}

function findAtom(
  residue: Residue,
  atomMap: Map<number, Atom>,
  name: string,
): Atom | null {
  for (const serial of residue.atoms) {
    const atom = atomMap.get(serial);
    if (atom && atom.name.trim() === name) return atom;
  }
  return null;
}

/** Compute dihedral angle (degrees) between four atoms; null if any atom missing */
function dihedral(a: Atom | null, b: Atom | null, c: Atom | null, d: Atom | null): number | null {
  if (!a || !b || !c || !d) return null;

  const b1 = subtract(b, a);
  const b2 = subtract(c, b);
  const b3 = subtract(d, c);

  const n1 = cross(b1, b2);
  const n2 = cross(b2, b3);

  const m1 = cross(n1, normalize(b2));

  const x = dot(n1, n2);
  const y = dot(m1, n2);

  return (Math.atan2(y, x) * 180) / Math.PI;
}

function subtract(a: Atom, b: Atom): [number, number, number] {
  return [a.x - b.x, a.y - b.y, a.z - b.z];
}

function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** Flatten all residues from chains for worker processing */
export function flattenResidues(
  chains: Array<{ id: string; residues: Residue[] }>,
): Residue[] {
  const result: Residue[] = [];
  for (const chain of chains) {
    for (const residue of chain.residues) {
      result.push({ ...residue, chainID: chain.id });
    }
  }
  return result;
}
