import { describe, expect, it } from 'vitest';
import type { MoleculeData, TourStep } from '../src/parsers/types';
import { buildHighlightTargets } from '../src/utils/applyTourStep';

const data: MoleculeData = {
  atoms: [],
  bonds: [],
  chains: [
    {
      id: 'A',
      residues: [
        { seq: 87, name: 'HIS', chainID: 'A', atoms: [] },
        { seq: 99, name: 'ASP', chainID: 'A', atoms: [] },
      ],
    },
    {
      id: 'B',
      residues: [
        { seq: 63, name: 'HIS', chainID: 'B', atoms: [] },
        { seq: 87, name: 'HIS', chainID: 'B', atoms: [] },
      ],
    },
  ],
  center: [0, 0, 0],
  boundingRadius: 50,
};

describe('applyTourStep helpers', () => {
  it('builds highlight targets across specified chains', () => {
    const step: TourStep = {
      id: 'binding',
      title: 'Binding',
      body: 'Binding site',
      cameraPosition: [0, 0, 0],
      cameraTarget: [0, 0, 0],
      highlightResidues: [63, 87],
      highlightChains: ['B'],
    };

    expect(buildHighlightTargets(step, data)).toEqual([
      { seq: 63, chainID: 'B' },
      { seq: 87, chainID: 'B' },
    ]);
  });

  it('searches all chains when highlightChains omitted', () => {
    const step: TourStep = {
      id: 'iface',
      title: 'Interface',
      body: 'Interface',
      cameraPosition: [0, 0, 0],
      cameraTarget: [0, 0, 0],
      highlightResidues: [99],
    };

    expect(buildHighlightTargets(step, data)).toEqual([{ seq: 99, chainID: 'A' }]);
  });
});
