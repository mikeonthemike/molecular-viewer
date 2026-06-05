import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ViewerCanvas } from '../src/components/ViewerCanvas';

vi.mock('../src/renderers/MoleculeViewer', () => ({
  MoleculeViewer: vi.fn().mockImplementation(() => ({
    load: vi.fn(),
    setRepresentation: vi.fn(),
    setColorScheme: vi.fn(),
    setShowHydrogens: vi.fn(),
    setVisibleChains: vi.fn(),
    clearMeasurements: vi.fn(),
    addMeasurement: vi.fn(),
    refreshBonds: vi.fn(),
    clearHighlights: vi.fn(),
    highlightResidues: vi.fn(),
    getCameraState: vi.fn(() => ({ position: [0, 0, 0], target: [0, 0, 0] })),
    animateCameraTo: vi.fn(() => Promise.resolve()),
    dispose: vi.fn(),
  })),
}));

describe('ViewerCanvas', () => {
  it('mounts without error and disposes on unmount', () => {
    const { unmount } = render(<ViewerCanvas />);
    expect(screen.getByTestId('viewer-canvas')).toBeTruthy();
    unmount();
  });
});
