import { useStore } from '../store';
import styles from './MeasureOverlay.module.css';

export function MeasureOverlay() {
  const measurements = useStore((s) => s.measurements);
  const clearMeasurements = useStore((s) => s.clearMeasurements);

  if (measurements.length === 0) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <span>Measurements</span>
        <button type="button" onClick={clearMeasurements} className={styles.clearBtn}>
          Clear all
        </button>
      </div>
      <div className={styles.pills}>
        {measurements.map((m) => (
          <span key={m.id} className={styles.pill}>
            {m.atomA.name} ({m.atomA.residueName}
            {m.atomA.residueSeq}) — {m.atomB.name} ({m.atomB.residueName}
            {m.atomB.residueSeq}): {m.distance.toFixed(2)} Å
          </span>
        ))}
      </div>
    </div>
  );
}
