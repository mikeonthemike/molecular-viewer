import { ControlsPanel } from './components/ControlsPanel';
import { FileUpload } from './components/FileUpload';
import { MeasureOverlay } from './components/MeasureOverlay';
import { SelectionInfo } from './components/SelectionInfo';
import { ViewerCanvas } from './components/ViewerCanvas';
import styles from './App.module.css';

export function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Molecular Viewer</h1>
        <FileUpload />
      </header>
      <div className={styles.main}>
        <ControlsPanel />
        <div className={styles.viewerArea}>
          <ViewerCanvas />
          <MeasureOverlay />
        </div>
      </div>
      <SelectionInfo />
    </div>
  );
}
