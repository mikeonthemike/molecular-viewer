import { describe, expect, it } from 'vitest';
import type { MoleculeData, TourStep } from '../src/parsers/types';
import { easeInOutCubic, lerp3, resolveTourCamera } from '../src/utils/tourCamera';

const minimalData: MoleculeData = {
  atoms: [],
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
});
