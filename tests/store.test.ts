import { describe, expect, it, beforeEach } from 'vitest';
import { useStore } from '../src/store';
import type { MoleculeData } from '../src/parsers/types';

const minimalData: MoleculeData = {
  atoms: [],
  bonds: [],
  chains: [{ id: 'A', residues: [] }],
  center: [0, 0, 0],
  boundingRadius: 10,
};

describe('store slices', () => {
  beforeEach(() => {
    useStore.setState({
      data: null,
      loading: false,
      error: null,
      representation: 'ball-and-stick',
      colorScheme: 'element',
      showHydrogens: true,
      visibleChains: new Set(),
      structureVersion: 0,
      selectedAtom: null,
      measurements: [],
      highlightedChain: null,
      pendingMeasureAtom: null,
    });
  });

  it('loads molecule data and increments structure version', () => {
    useStore.getState().setData(minimalData);
    expect(useStore.getState().data).toEqual(minimalData);
    expect(useStore.getState().structureVersion).toBe(1);
    expect(useStore.getState().error).toBeNull();
  });

  it('changes representation', () => {
    useStore.getState().setRepresentation('ribbon');
    expect(useStore.getState().representation).toBe('ribbon');
  });

  it('selects and clears atom', () => {
    const atom = {
      serial: 1,
      name: 'CA',
      element: 'C',
      residueName: 'ALA',
      chainID: 'A',
      residueSeq: 1,
      x: 0,
      y: 0,
      z: 0,
    };
    useStore.getState().selectAtom(atom);
    expect(useStore.getState().selectedAtom).toEqual(atom);
    useStore.getState().selectAtom(null);
    expect(useStore.getState().selectedAtom).toBeNull();
  });

  it('adds and clears measurements', () => {
    const a = {
      serial: 1,
      name: 'N',
      element: 'N',
      residueName: 'ALA',
      chainID: 'A',
      residueSeq: 1,
      x: 0,
      y: 0,
      z: 0,
    };
    const b = { ...a, serial: 2, name: 'CA', x: 1.5 };

    useStore.getState().addMeasurementPair(a);
    useStore.getState().addMeasurementPair(b);
    expect(useStore.getState().measurements).toHaveLength(1);

    useStore.getState().clearMeasurements();
    expect(useStore.getState().measurements).toHaveLength(0);
  });
});
