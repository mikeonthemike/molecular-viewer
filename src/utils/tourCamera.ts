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

/** Average world-space centroid of all highlighted residues on a tour step */
export function computeHighlightCentroid(
  step: TourStep,
  data: MoleculeData,
): [number, number, number] | null {
  if (step.highlightResidues.length === 0) return null;

  const chains =
    step.highlightChains && step.highlightChains.length > 0
      ? step.highlightChains
      : data.chains.map((c) => c.id);

  let sx = 0;
  let sy = 0;
  let sz = 0;
  let count = 0;

  for (const seq of step.highlightResidues) {
    for (const chainID of chains) {
      const centroid = residueCentroid(data, seq, chainID);
      if (!centroid) continue;
      sx += centroid[0];
      sy += centroid[1];
      sz += centroid[2];
      count += 1;
    }
  }

  if (count === 0) return null;
  return [sx / count, sy / count, sz / count];
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
  const highlightAnchor = computeHighlightCentroid(step, data);
  const anchor = highlightAnchor ?? [cx, cy, cz];

  let position: [number, number, number];
  if (step.cameraPositionScale) {
    const [sx, sy, sz] = step.cameraPositionScale;
    position = [anchor[0] + sx * r, anchor[1] + sy * r, anchor[2] + sz * r];
  } else {
    position = step.cameraPosition;
  }

  let target: [number, number, number];
  if (step.cameraTargetScale) {
    const [tx, ty, tz] = step.cameraTargetScale;
    target = [anchor[0] + tx * r, anchor[1] + ty * r, anchor[2] + tz * r];
  } else if (highlightAnchor) {
    target = highlightAnchor;
  } else {
    target = step.cameraTarget;
  }

  return { position, target };
}
