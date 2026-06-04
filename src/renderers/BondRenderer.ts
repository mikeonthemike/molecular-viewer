import * as THREE from 'three';
import type { Atom, Bond } from '../parsers/types';

/** Cylinder meshes for covalent bonds */
export class BondRenderer {
  build(
    bonds: Bond[],
    atoms: Atom[],
    radius: number,
    center: [number, number, number] = [0, 0, 0],
  ): THREE.Group {
    const [cx, cy, cz] = center;
    const group = new THREE.Group();
    const atomMap = new Map<number, Atom>();
    for (const atom of atoms) {
      atomMap.set(atom.serial, atom);
    }

    const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });

    for (const bond of bonds) {
      const a = atomMap.get(bond.atomA);
      const b = atomMap.get(bond.atomB);
      if (!a || !b) continue;

      const start = new THREE.Vector3(a.x - cx, a.y - cy, a.z - cz);
      const end = new THREE.Vector3(b.x - cx, b.y - cy, b.z - cz);
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      if (length < 0.01) continue;

      const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
      const mesh = new THREE.Mesh(geometry, material);

      const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mesh.position.copy(midpoint);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize(),
      );

      group.add(mesh);
    }

    return group;
  }
}
