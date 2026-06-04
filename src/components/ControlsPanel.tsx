import { useTransition } from 'react';
import { useStore } from '../store';
import type { ColorScheme, RepresentationMode } from '../parsers/types';
import styles from './ControlsPanel.module.css';

const REPRESENTATIONS: { mode: RepresentationMode; label: string }[] = [
  { mode: 'ball-and-stick', label: 'Ball & Stick' },
  { mode: 'space-filling', label: 'Space Fill' },
  { mode: 'ribbon', label: 'Ribbon' },
  { mode: 'backbone', label: 'Backbone' },
];

const COLOR_SCHEMES: { scheme: ColorScheme; label: string }[] = [
  { scheme: 'element', label: 'Element (CPK)' },
  { scheme: 'chain', label: 'Chain' },
  { scheme: 'residueType', label: 'Residue Type' },
  { scheme: 'bFactor', label: 'B-Factor' },
  { scheme: 'secondaryStructure', label: 'Secondary Structure' },
];

export function ControlsPanel() {
  const [isPending, startTransition] = useTransition();

  const representation = useStore((s) => s.representation);
  const colorScheme = useStore((s) => s.colorScheme);
  const showHydrogens = useStore((s) => s.showHydrogens);
  const visibleChains = useStore((s) => s.visibleChains);
  const data = useStore((s) => s.data);

  const setRepresentation = useStore((s) => s.setRepresentation);
  const setColorScheme = useStore((s) => s.setColorScheme);
  const setShowHydrogens = useStore((s) => s.setShowHydrogens);
  const toggleChainVisibility = useStore((s) => s.toggleChainVisibility);

  const handleRepresentation = (mode: RepresentationMode) => {
    startTransition(() => setRepresentation(mode));
  };

  const handleScreenshot = () => {
    const canvas = document.querySelector('[data-testid="viewer-canvas"] canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'molecule-screenshot.png';
    link.href = url;
    link.click();
  };

  return (
    <aside className={`${styles.panel} ${isPending ? styles.pending : ''}`}>
      <h2 className={styles.heading}>Display</h2>

      <div className={styles.section}>
        <span className={styles.label}>Representation</span>
        <div className={styles.buttonGroup}>
          {REPRESENTATIONS.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              className={representation === mode ? styles.active : ''}
              onClick={() => handleRepresentation(mode)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label} htmlFor="color-scheme">
          Colour scheme
        </label>
        <select
          id="color-scheme"
          value={colorScheme}
          onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
          className={styles.select}
        >
          {COLOR_SCHEMES.map(({ scheme, label }) => (
            <option key={scheme} value={scheme}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={showHydrogens}
            onChange={(e) => setShowHydrogens(e.target.checked)}
          />
          Show hydrogens
        </label>
      </div>

      {data && data.chains.length > 0 && (
        <div className={styles.section}>
          <span className={styles.label}>Chains</span>
          <div className={styles.chainList}>
            {data.chains.map((chain) => (
              <label key={chain.id} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={visibleChains.has(chain.id)}
                  onChange={() => toggleChainVisibility(chain.id)}
                />
                Chain {chain.id}
              </label>
            ))}
          </div>
        </div>
      )}

      <button type="button" className={styles.screenshotBtn} onClick={handleScreenshot}>
        Screenshot
      </button>
    </aside>
  );
}
