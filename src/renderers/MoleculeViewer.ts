import * as THREE from 'three';
import type { Atom, ColorScheme, MoleculeData, RepresentationMode } from '../parsers/types';
import { ATOM_DISPLAY_RADIUS, VDW_RADII } from '../utils/constants';
import { computeBFactorRange, getAtomColor } from '../utils/colorSchemes';
import { AtomRenderer } from './AtomRenderer';
import { BondRenderer } from './BondRenderer';
import { RibbonRenderer } from './RibbonRenderer';

type RendererBackend = THREE.WebGLRenderer;

/** Three.js scene orchestrator for molecular visualization */
export class MoleculeViewer {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: RendererBackend | null = null;
  private controls: InstanceType<typeof import('three/examples/jsm/controls/OrbitControls.js').OrbitControls> | null = null;
  private atomRenderer: AtomRenderer;
  private bondRenderer: BondRenderer;
  private ribbonRenderer: RibbonRenderer;
  private backboneLines: THREE.LineSegments | null = null;
  private moleculeGroup: THREE.Group | null = null;
  private animationId: number | null = null;
  /** Guards async init against React StrictMode mount/unmount/remount races */
  private initGeneration = 0;
  private disposed = false;
  private rendererReady = false;
  private data: MoleculeData | null = null;
  private representation: RepresentationMode = 'ball-and-stick';
  private colorScheme: ColorScheme = 'element';
  private showHydrogens = true;
  private visibleChains = new Set<string>();
  private measurementGroup = new THREE.Group();
  private highlightGroup = new THREE.Group();
  private coordinateCenter: [number, number, number] = [0, 0, 0];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private resizeObserver: ResizeObserver | null = null;
  private bFactorRange: [number, number] = [0, 100];
  private residueSS = new Map<string, 'helix' | 'sheet' | 'loop'>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e14);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    this.camera.position.set(0, 0, 100);

    this.atomRenderer = new AtomRenderer();
    this.bondRenderer = new BondRenderer();
    this.ribbonRenderer = new RibbonRenderer();

    void this.initRenderer();
  }

  private async initRenderer(): Promise<void> {
    const generation = ++this.initGeneration;

    const renderer = this.createRenderer();
    const controls = await this.createControls();

    // StrictMode may dispose this instance before async init completes
    if (this.disposed || generation !== this.initGeneration) {
      renderer.dispose();
      controls.dispose();
      return;
    }

    this.renderer = renderer;
    this.controls = controls;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(1, 1, 1);
    this.scene.add(ambient, directional);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas.parentElement ?? this.canvas);

    this.handleResize();
    this.rendererReady = true;
    this.animate();
  }

  /** WebGL2 renderer — avoids duplicate Three.js instance from the separate three/webgpu build */
  private createRenderer(): RendererBackend {
    return new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
  }

  private async createControls() {
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    const controls = new OrbitControls(this.camera, this.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.8;
    return controls;
  }

  load(data: MoleculeData): void {
    this.clearScene();
    this.data = data;
    this.coordinateCenter = data.center;
    this.bFactorRange = computeBFactorRange(data.atoms);
    this.visibleChains = new Set(data.chains.map((c) => c.id));

    this.moleculeGroup = new THREE.Group();
    this.moleculeGroup.position.set(...data.center);
    this.scene.add(this.moleculeGroup);
    this.moleculeGroup.add(this.measurementGroup);
    this.moleculeGroup.add(this.highlightGroup);

    this.residueSS.clear();
    for (const chain of data.chains) {
      for (const residue of chain.residues) {
        this.residueSS.set(
          `${chain.id}:${residue.seq}`,
          residue.secondaryStructure ?? 'loop',
        );
      }
    }

    this.buildRepresentation();
    this.resetCamera();
  }

  private getFilteredAtoms(): Atom[] {
    if (!this.data) return [];
    return this.data.atoms.filter((a) => {
      if (!this.showHydrogens && a.element.toUpperCase() === 'H') return false;
      if (!this.visibleChains.has(a.chainID)) return false;
      return true;
    });
  }

  private buildRepresentation(): void {
    if (!this.data || !this.moleculeGroup) return;

    const center = this.coordinateCenter;
    const atoms = this.getFilteredAtoms();
    const colorFn = (atom: Atom) =>
      getAtomColor(atom, this.colorScheme, {
        bFactorRange: this.bFactorRange,
        secondaryStructure: this.residueSS.get(`${atom.chainID}:${atom.residueSeq}`),
      });

    if (this.representation === 'ribbon') {
      const ribbon = this.ribbonRenderer.build(this.data, this.visibleChains, this.residueSS, center);
      this.moleculeGroup.add(ribbon);
      return;
    }

    if (this.representation === 'backbone') {
      const backbone = this.buildBackbone(atoms, center);
      if (backbone) {
        this.backboneLines = backbone;
        this.moleculeGroup.add(backbone);
      }
      return;
    }

    const radiusFn =
      this.representation === 'space-filling'
        ? (atom: Atom) => VDW_RADII[atom.element.toUpperCase()] ?? ATOM_DISPLAY_RADIUS
        : () => ATOM_DISPLAY_RADIUS;

    const detail = new THREE.Group();
    detail.add(this.atomRenderer.build(atoms, colorFn, radiusFn, 16, center));

    if (this.representation === 'ball-and-stick' && this.data.bonds.length > 0) {
      detail.add(this.bondRenderer.build(this.data.bonds, this.data.atoms, 0.15, center));
    }

    this.moleculeGroup.add(detail);
  }

  private buildBackbone(atoms: Atom[], center: [number, number, number]): THREE.LineSegments | null {
    const [cx, cy, cz] = center;
    const caAtoms = atoms.filter((a) => a.name.trim() === 'CA');
    const positions: number[] = [];

    const byChain = new Map<string, Atom[]>();
    for (const atom of caAtoms) {
      const list = byChain.get(atom.chainID) ?? [];
      list.push(atom);
      byChain.set(atom.chainID, list);
    }

    for (const chainAtoms of byChain.values()) {
      chainAtoms.sort((a, b) => a.residueSeq - b.residueSeq);
      for (let i = 0; i < chainAtoms.length - 1; i += 1) {
        const a = chainAtoms[i]!;
        const b = chainAtoms[i + 1]!;
        positions.push(a.x - cx, a.y - cy, a.z - cz, b.x - cx, b.y - cy, b.z - cz);
      }
    }

    if (positions.length === 0) return null;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
    return new THREE.LineSegments(geometry, material);
  }

  setRepresentation(mode: RepresentationMode): void {
    this.representation = mode;
    if (this.data) {
      this.clearSceneObjects();
      this.buildRepresentation();
    }
  }

  setColorScheme(scheme: ColorScheme): void {
    this.colorScheme = scheme;
    if (this.data) {
      this.clearSceneObjects();
      this.buildRepresentation();
    }
  }

  setShowHydrogens(show: boolean): void {
    this.showHydrogens = show;
    if (this.data) {
      this.clearSceneObjects();
      this.buildRepresentation();
    }
  }

  setVisibleChains(chains: Set<string>): void {
    this.visibleChains = chains;
    if (this.data) {
      this.clearSceneObjects();
      this.buildRepresentation();
    }
  }

  highlightResidue(seq: number, chainID: string): void {
    this.clearHighlights();
    if (!this.data) return;

    const residue = this.data.chains
      .find((c) => c.id === chainID)
      ?.residues.find((r) => r.seq === seq);

    if (!residue) return;

    const positions: number[] = [];
    const [cx, cy, cz] = this.coordinateCenter;
    for (const serial of residue.atoms) {
      const atom = this.data.atoms.find((a) => a.serial === serial);
      if (atom) positions.push(atom.x - cx, atom.y - cy, atom.z - cz);
    }

    if (positions.length === 0) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffff00, size: 8, sizeAttenuation: true });
    const points = new THREE.Points(geometry, material);
    this.highlightGroup.add(points);
  }

  clearHighlights(): void {
    while (this.highlightGroup.children.length > 0) {
      const child = this.highlightGroup.children[0]!;
      this.highlightGroup.remove(child);
      this.disposeObject(child);
    }
  }

  addMeasurement(atomA: Atom, atomB: Atom): void {
    const dx = atomB.x - atomA.x;
    const dy = atomB.y - atomA.y;
    const dz = atomB.z - atomA.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const [cx, cy, cz] = this.coordinateCenter;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(atomA.x - cx, atomA.y - cy, atomA.z - cz),
      new THREE.Vector3(atomB.x - cx, atomB.y - cy, atomB.z - cz),
    ]);
    const material = new THREE.LineDashedMaterial({ color: 0x00ff88, dashSize: 0.3, gapSize: 0.15 });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.userData = { distance, atomA, atomB };
    this.measurementGroup.add(line);
  }

  clearMeasurements(): void {
    while (this.measurementGroup.children.length > 0) {
      const child = this.measurementGroup.children[0]!;
      this.measurementGroup.remove(child);
      this.disposeObject(child);
    }
  }

  /** Raycast against instanced atom meshes; returns atom serial or null */
  pickAtom(clientX: number, clientY: number): Atom | null {
    if (!this.data || !this.renderer) return null;

    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const meshes: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.InstancedMesh) meshes.push(obj);
    });

    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return null;

    const hit = hits[0]!;
    if (!(hit.object instanceof THREE.InstancedMesh) || hit.instanceId === undefined) return null;

    const serial = (hit.object.userData.serials as number[] | undefined)?.[hit.instanceId];
    if (serial === undefined) return null;

    return this.data.atoms.find((a) => a.serial === serial) ?? null;
  }

  takeScreenshot(): string {
    if (!this.renderer) return '';
    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL('image/png');
  }

  resetCamera(): void {
    if (!this.data) return;
    const [cx, cy, cz] = this.data.center;
    const dist = this.data.boundingRadius * 2.5;

    this.camera.position.set(cx, cy, cz + dist);
    this.controls?.target.set(cx, cy, cz);
    this.controls?.update();
  }

  updateSecondaryStructure(residues: Array<{ seq: number; chainID: string; secondaryStructure?: string }>): void {
    for (const r of residues) {
      if (r.secondaryStructure) {
        this.residueSS.set(
          `${r.chainID}:${r.seq}`,
          r.secondaryStructure as 'helix' | 'sheet' | 'loop',
        );
      }
    }
    if (this.data && (this.representation === 'ribbon' || this.colorScheme === 'secondaryStructure')) {
      this.clearSceneObjects();
      this.buildRepresentation();
    }
  }

  private handleResize(): void {
    const parent = this.canvas.parentElement;
    if (!parent || !this.renderer) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private animate = (): void => {
    if (this.disposed) return;

    this.animationId = requestAnimationFrame(this.animate);

    if (!this.rendererReady || !this.renderer) return;

    const parent = this.canvas.parentElement;
    if (!parent || parent.clientWidth === 0 || parent.clientHeight === 0) return;

    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  };

  private clearSceneObjects(): void {
    if (this.backboneLines && this.moleculeGroup) {
      this.moleculeGroup.remove(this.backboneLines);
      this.disposeObject(this.backboneLines);
      this.backboneLines = null;
    }

    if (this.moleculeGroup) {
      const group = this.moleculeGroup;
      group.children
        .filter((child) => child !== this.measurementGroup && child !== this.highlightGroup)
        .slice()
        .forEach((child) => {
          group.remove(child);
          this.disposeObject(child);
        });
    }
  }

  private clearScene(): void {
    if (this.moleculeGroup) {
      this.scene.remove(this.moleculeGroup);
      this.measurementGroup.removeFromParent();
      this.highlightGroup.removeFromParent();
      this.disposeObject(this.moleculeGroup);
      this.moleculeGroup = null;
    }
    this.backboneLines = null;
    this.clearHighlights();
    this.clearMeasurements();
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }

  dispose(): void {
    this.disposed = true;
    this.initGeneration += 1;
    this.rendererReady = false;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.clearScene();
    this.renderer?.dispose();
    this.renderer = null;
  }
}
