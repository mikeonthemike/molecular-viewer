import type { MoleculeData, TourStep } from '../parsers/types';

export interface ResolvedCamera {
  position: [number, number, number];
  target: [number, number, number];
}

/** Ease-in-out cubic for smooth camera transitions */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Lerp between two 3-vectors */
export function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function residueCentroid(
  data: MoleculeData,
  seq: number,
  chainID?: string,
): [number, number, number] | null {
  const chains = chainID ? data.chains.filter((c) => c.id === chainID) : data.chains;
  for (const chain of chains) {
    const residue = chain.residues.find((r) => r.seq === seq);
    if (!residue) continue;

    let sx = 0;
    let sy = 0;
    let sz = 0;
    let count = 0;
    for (const serial of residue.atoms) {
      const atom = data.atoms.find((a) => a.serial === serial);
      if (atom) {
        sx += atom.x;
        sy += atom.y;
        sz += atom.z;
        count += 1;
      }
    }
    if (count > 0) return [sx / count, sy / count, sz / count];
  }
  return null;
}

/** Resolve portable scale-based or absolute camera coords for a tour step */
export function resolveTourCamera(step: TourStep, data: MoleculeData): ResolvedCamera {
  const [cx, cy, cz] = data.center;
  const r = data.boundingRadius;

  let position: [number, number, number];
  if (step.cameraPositionScale) {
    const [sx, sy, sz] = step.cameraPositionScale;
    position = [cx + sx * r, cy + sy * r, cz + sz * r];
  } else {
    position = step.cameraPosition;
  }

  let target: [number, number, number];
  if (step.cameraTargetScale) {
    const [tx, ty, tz] = step.cameraTargetScale;
    target = [cx + tx * r, cy + ty * r, cz + tz * r];
  } else if (step.highlightResidues.length > 0) {
    const chainID = step.highlightChains?.[0];
    const centroid = residueCentroid(data, step.highlightResidues[0]!, chainID);
    target = centroid ?? [cx, cy, cz];
  } else {
    target = step.cameraTarget;
  }

  return { position, target };
}
