import type { MoleculeData, MoleculeResult } from '../parsers/types';

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../engine/moleculeWorker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return worker;
}

/** Run bond calculation and secondary structure detection off the main thread */
export function processMoleculeInWorker(
  data: MoleculeData,
  onResult: (result: MoleculeResult) => void,
): () => void {
  const w = getWorker();

  const handler = (event: MessageEvent<MoleculeResult>) => {
    onResult(event.data);
  };

  w.addEventListener('message', handler);
  w.postMessage({
    type: 'process',
    atoms: data.atoms,
    bonds: data.bonds,
    hasConectBonds: data.hasConectBonds ?? false,
  });

  return () => w.removeEventListener('message', handler);
}
