import { getLibraryEntry } from '../data/library';
import type { MoleculeData, Tour, TourStep } from '../parsers/types';
import { buildHighlightTargets } from './applyTourStep';
import { getPolymerChainIds } from './polymerChains';
import { getStructureInventory, type StructureInventory } from './structureInventory';

export type TourValidationSeverity = 'error' | 'warning';

/** Machine-readable issue codes for tour CI and authoring */
export type TourValidationCode =
  | 'missing-library-entry'
  | 'duplicate-step-id'
  | 'missing-camera-scale'
  | 'unknown-visible-chain'
  | 'ligand-chain-in-visible'
  | 'unknown-highlight-chain'
  | 'missing-highlight-residue'
  | 'polymer-count-mismatch'
  | 'visible-chains-not-subset'
  | 'empty-tour';

export interface TourValidationIssue {
  tourId: string;
  stepId?: string;
  severity: TourValidationSeverity;
  code: TourValidationCode;
  message: string;
}

function validateStepAgainstData(
  tour: Tour,
  step: TourStep,
  inventory: StructureInventory,
  data: MoleculeData,
): TourValidationIssue[] {
  const issues: TourValidationIssue[] = [];
  const polymerSet = new Set(inventory.polymerChainIds);
  const allChainSet = new Set(data.chains.map((c) => c.id));

  if (!step.cameraPositionScale && step.cameraPosition.every((v) => v === 0)) {
    issues.push({
      tourId: tour.id,
      stepId: step.id,
      severity: 'warning',
      code: 'missing-camera-scale',
      message: `Step "${step.id}" has no cameraPositionScale — prefer scale-based cameras for portability`,
    });
  }

  if (step.visibleChains) {
    for (const chainId of step.visibleChains) {
      if (!allChainSet.has(chainId)) {
        issues.push({
          tourId: tour.id,
          stepId: step.id,
          severity: 'error',
          code: 'unknown-visible-chain',
          message: `visibleChains includes "${chainId}" but structure has [${[...allChainSet].join(', ')}]`,
        });
      } else if (!polymerSet.has(chainId)) {
        issues.push({
          tourId: tour.id,
          stepId: step.id,
          severity: 'error',
          code: 'ligand-chain-in-visible',
          message: `visibleChains includes ligand asym unit "${chainId}" — use polymer chains only (${[...polymerSet].join(', ')})`,
        });
      }
    }
  }

  if (step.highlightChains) {
    for (const chainId of step.highlightChains) {
      if (!allChainSet.has(chainId)) {
        issues.push({
          tourId: tour.id,
          stepId: step.id,
          severity: 'error',
          code: 'unknown-highlight-chain',
          message: `highlightChains includes unknown chain "${chainId}"`,
        });
      }
    }
  }

  const highlightTargets = buildHighlightTargets(step, data);
  const expectedHighlights =
    step.highlightResidues.length *
    (step.highlightChains?.length ?? inventory.polymerChainIds.length);
  if (step.highlightResidues.length > 0 && highlightTargets.length === 0) {
    issues.push({
      tourId: tour.id,
      stepId: step.id,
      severity: 'error',
      code: 'missing-highlight-residue',
      message: `No highlight targets resolved for residues [${step.highlightResidues.join(', ')}]`,
    });
  } else if (
    step.highlightChains &&
    highlightTargets.length < step.highlightResidues.length * step.highlightChains.length
  ) {
    issues.push({
      tourId: tour.id,
      stepId: step.id,
      severity: 'error',
      code: 'missing-highlight-residue',
      message: `Only ${highlightTargets.length}/${expectedHighlights} highlight targets found for step "${step.id}"`,
    });
  }

  return issues;
}

/** Validate static tour metadata and content against parsed RCSB structure data */
export function validateTourAgainstData(tour: Tour, data: MoleculeData): TourValidationIssue[] {
  const issues: TourValidationIssue[] = [];
  const inventory = getStructureInventory(tour.structureId, data);

  if (!getLibraryEntry(tour.structureId)) {
    issues.push({
      tourId: tour.id,
      severity: 'error',
      code: 'missing-library-entry',
      message: `structureId "${tour.structureId}" has no matching library entry`,
    });
  }

  if (tour.steps.length === 0) {
    issues.push({
      tourId: tour.id,
      severity: 'error',
      code: 'empty-tour',
      message: 'Tour has no steps',
    });
  }

  const stepIds = tour.steps.map((s) => s.id);
  if (new Set(stepIds).size !== stepIds.length) {
    issues.push({
      tourId: tour.id,
      severity: 'error',
      code: 'duplicate-step-id',
      message: 'Duplicate step ids in tour',
    });
  }

  if (
    tour.expectedPolymerChainCount !== undefined &&
    inventory.polymerChains.length !== tour.expectedPolymerChainCount
  ) {
    issues.push({
      tourId: tour.id,
      severity: 'error',
      code: 'polymer-count-mismatch',
      message: `Expected ${tour.expectedPolymerChainCount} polymer chain(s) but RCSB deposit has ${inventory.polymerChains.length} ([${inventory.polymerChainIds.join(', ')}])`,
    });
  }

  const defaultVisible = new Set(getPolymerChainIds(data));
  for (const step of tour.steps) {
    issues.push(...validateStepAgainstData(tour, step, inventory, data));

    if (step.visibleChains) {
      const extra = step.visibleChains.filter((id) => !defaultVisible.has(id));
      if (extra.length > 0 && !issues.some((i) => i.stepId === step.id && i.code === 'unknown-visible-chain')) {
        issues.push({
          tourId: tour.id,
          stepId: step.id,
          severity: 'warning',
          code: 'visible-chains-not-subset',
          message: `visibleChains [${step.visibleChains.join(', ')}] — polymer chains in deposit: [${[...defaultVisible].join(', ')}]`,
        });
      }
    }
  }

  if (
    tour.assemblyContext === 'asymmetric-unit' &&
    tour.expectedPolymerChainCount === undefined
  ) {
    issues.push({
      tourId: tour.id,
      severity: 'warning',
      code: 'polymer-count-mismatch',
      message:
        'assemblyContext is asymmetric-unit but expectedPolymerChainCount is not set — add it so CI catches deposit drift',
    });
  }

  return issues;
}

export function assertTourValid(tour: Tour, data: MoleculeData): void {
  const issues = validateTourAgainstData(tour, data);
  const errors = issues.filter((i) => i.severity === 'error');
  if (errors.length > 0) {
    const detail = errors.map((e) => `  [${e.code}] ${e.stepId ? `${e.stepId}: ` : ''}${e.message}`).join('\n');
    throw new Error(`Tour "${tour.id}" failed validation:\n${detail}`);
  }
}

export function formatValidationReport(issues: TourValidationIssue[]): string {
  if (issues.length === 0) return 'All tours valid.';
  return issues
    .map(
      (i) =>
        `${i.severity.toUpperCase()} ${i.tourId}${i.stepId ? `.${i.stepId}` : ''} [${i.code}]: ${i.message}`,
    )
    .join('\n');
}
