import type { ColorScheme, MoleculeData, RepresentationMode, TourStep } from '../parsers/types';
import type { MoleculeViewer } from '../renderers/MoleculeViewer';
import { resolveTourCamera } from './tourCamera';

/** Build {seq, chainID} pairs for multi-chain tour highlights */
export function buildHighlightTargets(
  step: TourStep,
  data: MoleculeData,
): Array<{ seq: number; chainID: string }> {
  const targets: Array<{ seq: number; chainID: string }> = [];
  const chains =
    step.highlightChains && step.highlightChains.length > 0
      ? step.highlightChains
      : data.chains.map((c) => c.id);

  for (const seq of step.highlightResidues) {
    for (const chainID of chains) {
      const exists = data.chains
        .find((c) => c.id === chainID)
        ?.residues.some((r) => r.seq === seq);
      if (exists) targets.push({ seq, chainID });
    }
  }

  return targets;
}

/** Apply a tour step to the viewer and store-driven representation settings */
export async function applyTourStep(
  viewer: MoleculeViewer,
  step: TourStep,
  data: MoleculeData,
  setRepresentation: (mode: RepresentationMode) => void,
  setColorScheme: (scheme: ColorScheme) => void,
  setVisibleChains?: (chains: Set<string>) => void,
): Promise<void> {
  if (step.visibleChains && setVisibleChains) {
    setVisibleChains(new Set(step.visibleChains));
  }

  if (step.representation) {
    setRepresentation(step.representation);
    viewer.setRepresentation(step.representation);
  }
  if (step.colorScheme) {
    setColorScheme(step.colorScheme);
    viewer.setColorScheme(step.colorScheme);
  }

  const highlights = buildHighlightTargets(step, data);
  if (highlights.length > 0) {
    viewer.highlightResidues(highlights);
  } else {
    viewer.clearHighlights();
  }

  const camera = resolveTourCamera(step, data);
  await viewer.animateCameraTo(camera.position, camera.target, 600);
}
