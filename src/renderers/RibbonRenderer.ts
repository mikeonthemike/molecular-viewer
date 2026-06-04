import * as THREE from 'three';
import type { MoleculeData } from '../parsers/types';

const SS_COLORS = {
  helix: 0xff00ff,
  sheet: 0xffff00,
  loop: 0xffffff,
};

/** Catmull-Rom tube ribbon through Cα atoms coloured by secondary structure */
export class RibbonRenderer {
  build(
    data: MoleculeData,
    visibleChains: Set<string>,
    residueSS: Map<string, 'helix' | 'sheet' | 'loop'>,
    center: [number, number, number] = [0, 0, 0],
  ): THREE.Group {
    const [cx, cy, cz] = center;
    const group = new THREE.Group();

    for (const chain of data.chains) {
      if (!visibleChains.has(chain.id)) continue;

      const caAtoms = chain.residues
        .flatMap((r) =>
          r.atoms
            .map((serial) => data.atoms.find((a) => a.serial === serial && a.name.trim() === 'CA'))
            .filter((a): a is NonNullable<typeof a> => a !== undefined),
        )
        .sort((a, b) => a.residueSeq - b.residueSeq);

      if (caAtoms.length < 4) continue;

      const points = caAtoms.map((a) => new THREE.Vector3(a.x - cx, a.y - cy, a.z - cz));
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, caAtoms.length * 4, 0.8, 8, false);

      const ssKey = `${chain.id}:${caAtoms[0]!.residueSeq}`;
      const ss = residueSS.get(ssKey) ?? 'loop';
      const material = new THREE.MeshStandardMaterial({
        color: SS_COLORS[ss],
        roughness: 0.5,
      });

      group.add(new THREE.Mesh(tubeGeometry, material));
    }

    return group;
  }
}
