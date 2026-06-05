import { describe, expect, it } from 'vitest';
import type { MoleculeData, TourStep } from '../src/parsers/types';
import {
  computeHighlightCentroid,
  easeInOutCubic,
  lerp3,
  resolveTourCamera,
} from '../src/utils/tourCamera';

const minimalData: MoleculeData = {
  atoms: [
    {
      serial: 1,
      name: 'CA',
      element: 'C',
      residueName: 'HIS',
      chainID: 'A',
      residueSeq: 87,
      x: 10,
      y: 20,
      z: 30,
    },
  ],
  bonds: [],
  chains: [
    {
      id: 'A',
      residues: [{ seq: 87, name: 'HIS', chainID: 'A', atoms: [1] }],
    },
  ],
  center: [10, 20, 30],
  boundingRadius: 40,
};

describe('tourCamera', () => {
  it('lerps between vectors', () => {
    expect(lerp3([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15]);
  });

  it('eases at endpoints', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('resolves scale-based camera from structure center', () => {
    const step: TourStep = {
      id: 'test',
      title: 'Test',
      body: 'Test',
      cameraPosition: [0, 0, 0],
      cameraTarget: [0, 0, 0],
      cameraPositionScale: [0, 0, 2.5],
      cameraTargetScale: [0, 0, 0],
      highlightResidues: [],
    };

    const camera = resolveTourCamera(step, minimalData);
    expect(camera.position).toEqual([10, 20, 130]);
    expect(camera.target).toEqual([10, 20, 30]);
  });

  it('anchors highlight steps on the residue centroid', () => {
    const step: TourStep = {
      id: 'focus',
      title: 'Focus',
      body: 'Focus',
      cameraPosition: [0, 0, 0],
      cameraTarget: [0, 0, 0],
      cameraPositionScale: [0, 0, 1],
      cameraTargetScale: [0, 0, 0],
      highlightResidues: [87],
      highlightChains: ['A'],
    };

    const anchor = computeHighlightCentroid(step, minimalData);
    expect(anchor).toEqual([10, 20, 30]);

    const camera = resolveTourCamera(step, minimalData);
    expect(camera.target).toEqual(anchor);
    expect(camera.position).toEqual([10, 20, 70]);
  });
});
