import { useStore } from '../store';
import styles from './SelectionInfo.module.css';

export function SelectionInfo() {
  const selectedAtom = useStore((s) => s.selectedAtom);

  if (!selectedAtom) {
    return (
      <div className={styles.panel}>
        <p className={styles.empty}>Click an atom to inspect</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Selected atom</h3>
      <dl className={styles.list}>
        <div>
          <dt>Element</dt>
          <dd>{selectedAtom.element}</dd>
        </div>
        <div>
          <dt>Atom name</dt>
          <dd>{selectedAtom.name}</dd>
        </div>
        <div>
          <dt>Residue</dt>
          <dd>
            {selectedAtom.residueName} {selectedAtom.residueSeq}
          </dd>
        </div>
        <div>
          <dt>Chain</dt>
          <dd>{selectedAtom.chainID}</dd>
        </div>
        <div>
          <dt>Coordinates (Å)</dt>
          <dd>
            {selectedAtom.x.toFixed(2)}, {selectedAtom.y.toFixed(2)}, {selectedAtom.z.toFixed(2)}
          </dd>
        </div>
        {selectedAtom.bFactor !== undefined && (
          <div>
            <dt>B-factor</dt>
            <dd>{selectedAtom.bFactor.toFixed(2)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
