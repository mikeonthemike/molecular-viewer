import type { Atom } from '../parsers/types';

/** Simple 3D k-d tree for spatial neighbour queries */
export class SpatialIndex {
  private root: KDNode | null = null;

  build(atoms: Atom[]): void {
    if (atoms.length === 0) {
      this.root = null;
      return;
    }
    const points = atoms.map((a) => ({ atom: a, x: a.x, y: a.y, z: a.z }));
    this.root = this.buildNode(points, 0);
  }

  /** Find all atom indices within radius of a query point */
  queryRadius(x: number, y: number, z: number, radius: number, atoms: Atom[]): number[] {
    if (!this.root) return [];
    const results: number[] = [];
    const radiusSq = radius * radius;
    this.search(this.root, x, y, z, radiusSq, 0, results, atoms);
    return results;
  }

  private buildNode(points: Array<{ atom: Atom; x: number; y: number; z: number }>, depth: number): KDNode {
    if (points.length === 0) {
      throw new Error('Cannot build KD node from empty points');
    }

    const axis = depth % 3;
    points.sort((a, b) => {
      const av = axis === 0 ? a.x : axis === 1 ? a.y : a.z;
      const bv = axis === 0 ? b.x : axis === 1 ? b.y : b.z;
      return av - bv;
    });

    const mid = Math.floor(points.length / 2);
    const point = points[mid]!;

    return {
      atomIndex: point.atom.serial - 1,
      x: point.x,
      y: point.y,
      z: point.z,
      axis,
      left: mid > 0 ? this.buildNode(points.slice(0, mid), depth + 1) : null,
      right: mid < points.length - 1 ? this.buildNode(points.slice(mid + 1), depth + 1) : null,
    };
  }

  private search(
    node: KDNode,
    qx: number,
    qy: number,
    qz: number,
    radiusSq: number,
    depth: number,
    results: number[],
    atoms: Atom[],
  ): void {
    const dx = node.x - qx;
    const dy = node.y - qy;
    const dz = node.z - qz;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq <= radiusSq) {
      results.push(node.atomIndex);
    }

    const axis = depth % 3;
    const diff = axis === 0 ? qx - node.x : axis === 1 ? qy - node.y : qz - node.z;

    const near = diff <= 0 ? node.left : node.right;
    const far = diff <= 0 ? node.right : node.left;

    if (near) this.search(near, qx, qy, qz, radiusSq, depth + 1, results, atoms);
    if (far && diff * diff <= radiusSq) {
      this.search(far, qx, qy, qz, radiusSq, depth + 1, results, atoms);
    }
  }
}

interface KDNode {
  atomIndex: number;
  x: number;
  y: number;
  z: number;
  axis: number;
  left: KDNode | null;
  right: KDNode | null;
}
