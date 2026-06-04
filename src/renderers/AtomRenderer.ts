import * as THREE from 'three';
import type { Atom } from '../parsers/types';

/** Instanced sphere meshes grouped by element for efficient atom rendering */
export class AtomRenderer {
  build(
    atoms: Atom[],
    colorFn: (atom: Atom) => string,
    radiusFn: (atom: Atom) => number,
    segments: number,
    center: [number, number, number] = [0, 0, 0],
  ): THREE.Group {
    const [cx, cy, cz] = center;
    const group = new THREE.Group();
    const byElement = new Map<string, Atom[]>();

    for (const atom of atoms) {
      const key = atom.element.toUpperCase();
      const list = byElement.get(key) ?? [];
      list.push(atom);
      byElement.set(key, list);
    }

    for (const [, elementAtoms] of byElement) {
      if (elementAtoms.length === 0) continue;

      const avgRadius = elementAtoms.reduce((s, a) => s + radiusFn(a), 0) / elementAtoms.length;
      const geometry = new THREE.SphereGeometry(avgRadius, segments, segments);
      const material = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 });
      const mesh = new THREE.InstancedMesh(geometry, material, elementAtoms.length);

      const color = new THREE.Color();
      const matrix = new THREE.Matrix4();
      const serials: number[] = [];

      elementAtoms.forEach((atom, i) => {
        matrix.makeTranslation(atom.x - cx, atom.y - cy, atom.z - cz);
        mesh.setMatrixAt(i, matrix);
        color.set(colorFn(atom));
        mesh.setColorAt(i, color);
        serials.push(atom.serial);
      });

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.userData.serials = serials;
      // Include all instance positions in the bounding sphere so frustum culling is stable at every camera angle
      mesh.computeBoundingSphere();

      group.add(mesh);
    }

    return group;
  }
}
