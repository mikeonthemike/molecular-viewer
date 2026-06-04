import * as THREE from 'three';
import type { Atom } from '../parsers/types';

/**
 * Placeholder for future solvent-accessible surface rendering (out of scope v1).
 * Currently builds a coarse convex hull point cloud for extensibility.
 */
export class SurfaceRenderer {
  build(atoms: Atom[]): THREE.Points {
    const positions: number[] = [];
    for (const atom of atoms) {
      positions.push(atom.x, atom.y, atom.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x4488ff, size: 0.5, transparent: true, opacity: 0.3 });
    return new THREE.Points(geometry, material);
  }
}
