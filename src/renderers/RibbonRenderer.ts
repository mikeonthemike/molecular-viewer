import * as THREE from 'three';
import type { ColorScheme, MoleculeData } from '../parsers/types';
import { getChainColor } from '../utils/colorSchemes';

const SS_COLORS = {
  helix: 0xff00ff,
  sheet: 0xffff00,
  loop: 0xcccccc,
};

type SecondaryStructure = 'helix' | 'sheet' | 'loop';

/** Catmull-Rom tube ribbon through Cα atoms with per-residue secondary-structure colouring */
export class RibbonRenderer {
  build(
    data: MoleculeData,
    visibleChains: Set<string>,
    residueSS: Map<string, SecondaryStructure>,
    center: [number, number, number] = [0, 0, 0],
    colorScheme: ColorScheme = 'secondaryStructure',
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

      if (caAtoms.length < 2) continue;

      const points = caAtoms.map(
        (atom) => new THREE.Vector3(atom.x - cx, atom.y - cy, atom.z - cz),
      );
      const ssPerPoint = caAtoms.map(
        (atom) => residueSS.get(`${chain.id}:${atom.residueSeq}`) ?? 'loop',
      );

      group.add(this.buildContinuousTube(points, ssPerPoint, colorScheme, chain.id));
    }

    return group;
  }

  /** One uninterrupted tube — vertex colours vary by residue SS without breaking the backbone */
  private buildContinuousTube(
    points: THREE.Vector3[],
    ssPerPoint: SecondaryStructure[],
    colorScheme: ColorScheme,
    chainId: string,
  ): THREE.Mesh {
    const pathPoints = [...points];
    const pathSS = [...ssPerPoint];

    // Catmull-Rom needs at least four control points
    if (pathPoints.length < 4) {
      const last = pathPoints[pathPoints.length - 1]!;
      const lastSS = pathSS[pathSS.length - 1] ?? 'loop';
      while (pathPoints.length < 4) {
        pathPoints.push(last.clone());
        pathSS.push(lastSS);
      }
    }

    const radialSegments = 8;
    const tubularSegments = Math.max(pathPoints.length * 4, 16);
    const curve = new THREE.CatmullRomCurve3(pathPoints);
    const geometry = new THREE.TubeGeometry(curve, tubularSegments, 0.8, radialSegments, false);

    const positionAttr = geometry.getAttribute('position');
    const vertsPerRing = radialSegments + 1;
    const chainColor = new THREE.Color(getChainColor(chainId));
    const colors = new Float32Array(positionAttr.count * 3);

    for (let vertexIndex = 0; vertexIndex < positionAttr.count; vertexIndex += 1) {
      const ringIndex = Math.floor(vertexIndex / vertsPerRing);
      const t = ringIndex / tubularSegments;
      const residueIndex = Math.min(
        pathSS.length - 1,
        Math.round(t * (pathSS.length - 1)),
      );
      const ss = pathSS[residueIndex] ?? 'loop';
      const color =
        colorScheme === 'secondaryStructure'
          ? new THREE.Color(SS_COLORS[ss])
          : chainColor;

      colors[vertexIndex * 3] = color.r;
      colors[vertexIndex * 3 + 1] = color.g;
      colors[vertexIndex * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.5,
    });

    return new THREE.Mesh(geometry, material);
  }
}
