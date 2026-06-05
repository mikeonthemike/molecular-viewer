import type { Tour } from '../parsers/types';

/** Static guided tours — camera scales are offsets from center in units of boundingRadius */
export const TOURS: Tour[] = [
  {
    id: 'haemoglobin-oxygen',
    structureId: '1HHO',
    title: 'How oxygen is carried in blood',
    audience: 'general',
    estimatedMinutes: 4,
    expectedPolymerChainCount: 2,
    assemblyContext: 'asymmetric-unit',
    steps: [
      {
        id: 'overview',
        title: 'Meet haemoglobin',
        body:
          'Haemoglobin in red blood cells is a tetramer — four subunits working as a team. This crystal structure contains one alpha chain (A) and one beta chain (B), the two chain types that pair up in the full molecule.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [0, 0, 2.5],
        cameraTargetScale: [0, 0, 0],
        visibleChains: ['A', 'B'],
        highlightResidues: [],
        representation: 'ribbon',
        colorScheme: 'chain',
      },
      {
        id: 'quaternary',
        title: 'Two chain types, one machine',
        body:
          'The two coloured ribbons are the alpha (A) and beta (B) subunits. In the complete protein found in blood, two alpha and two beta chains assemble into the four-part haemoglobin tetramer.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [1.0, 1.2, 2.2],
        cameraTargetScale: [0, 0, 0],
        visibleChains: ['A', 'B'],
        highlightResidues: [],
        representation: 'ribbon',
        colorScheme: 'chain',
      },
      {
        id: 'haem-group',
        title: 'The haem group',
        body:
          'Each subunit contains a haem group — a ring-shaped molecule with an iron atom at its centre. The orange glow marks the proximal histidine on the alpha chain that anchors the haem and helps control oxygen binding.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [-0.03, 0.56, 1.08],
        cameraTargetScale: [-0.53, 0.21, -0.02],
        visibleChains: ['A', 'B'],
        highlightResidues: [87],
        highlightChains: ['A'],
        representation: 'ball-and-stick',
        colorScheme: 'element',
      },
      {
        id: 'binding-site',
        title: 'Where oxygen binds',
        body:
          'Oxygen binds at the haem iron on each subunit. The orange glow highlights the binding pocket on the beta chain — including the distal histidine that helps stabilise bound oxygen.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [1.1, 0.33, 1.27],
        cameraTargetScale: [0.7, 0.08, 0.37],
        visibleChains: ['A', 'B'],
        highlightResidues: [63, 87],
        highlightChains: ['B'],
        representation: 'ball-and-stick',
        colorScheme: 'element',
      },
      {
        id: 'cooperativity',
        title: 'Cooperative binding',
        body:
          'When one subunit binds oxygen, subtle shape changes make it easier for the others to bind too. This cooperative effect is why haemoglobin is so efficient at picking up oxygen in the lungs.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [-1.25, 0.89, 2.73],
        cameraTargetScale: [-0.05, 0.09, 0.33],
        visibleChains: ['A', 'B'],
        highlightResidues: [99],
        highlightChains: ['A', 'B'],
        representation: 'ribbon',
        colorScheme: 'chain',
      },
    ],
  },
  {
    id: 'lysozyme-catalysis',
    structureId: '1LYZ',
    title: 'How lysozyme breaks bacterial cell walls',
    audience: 'general',
    estimatedMinutes: 4,
    expectedPolymerChainCount: 1,
    assemblyContext: 'asymmetric-unit',
    steps: [
      {
        id: 'overview',
        title: 'The first enzyme structure',
        body:
          'Lysozyme from hen egg white was the first enzyme ever solved by X-ray crystallography (1965). This single protein chain folds into a compact shape that can snip apart bacterial cell walls.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [0, 0, 2.5],
        cameraTargetScale: [0, 0, 0],
        visibleChains: ['A'],
        highlightResidues: [],
        representation: 'ribbon',
        colorScheme: 'secondaryStructure',
      },
      {
        id: 'fold',
        title: 'Helices and sheets',
        body:
          'The ribbon is coloured by secondary structure: alpha helices and beta sheets weave together into a stable globular fold. That compact architecture creates a deep groove where catalysis happens.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [1.0, 0.6, 2.0],
        cameraTargetScale: [0, 0, 0],
        visibleChains: ['A'],
        highlightResidues: [],
        representation: 'ribbon',
        colorScheme: 'secondaryStructure',
      },
      {
        id: 'catalytic-residues',
        title: 'The catalytic duo',
        body:
          'Glu35 and Asp52 are the classic catalytic pair. Glu35 donates a proton to activate the sugar linkage, while Asp52 stabilises the intermediate — together they hydrolyse the peptidoglycan bond.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [0.3, 0.35, 0.7],
        cameraTargetScale: [0, 0, 0],
        visibleChains: ['A'],
        highlightResidues: [35, 52],
        highlightChains: ['A'],
        representation: 'ball-and-stick',
        colorScheme: 'element',
      },
      {
        id: 'binding-groove',
        title: 'The binding groove',
        body:
          'Trp62 and Asp66 line the active-site cleft and help grip the carbohydrate chain of peptidoglycan. The orange glow marks the pocket where the substrate sits before cleavage.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [0.35, 0.5, 0.55],
        cameraTargetScale: [0, 0, 0],
        visibleChains: ['A'],
        highlightResidues: [62, 66],
        highlightChains: ['A'],
        representation: 'ball-and-stick',
        colorScheme: 'element',
      },
      {
        id: 'cell-wall',
        title: 'Defending against bacteria',
        body:
          'By cleaving peptidoglycan in bacterial cell walls, lysozyme weakens the protective shell and helps our immune system fight infection. The same enzyme is abundant in tears, saliva, and egg white.',
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        cameraPositionScale: [-0.5, 0.35, 1.1],
        cameraTargetScale: [0, 0, 0],
        visibleChains: ['A'],
        highlightResidues: [35, 52, 62],
        highlightChains: ['A'],
        representation: 'ribbon',
        colorScheme: 'secondaryStructure',
      },
    ],
  },
];

export function getTourById(id: string): Tour | undefined {
  return TOURS.find((t) => t.id === id);
}

export function getToursForStructure(structureId: string): Tour[] {
  const id = structureId.trim().toUpperCase();
  return TOURS.filter((t) => t.structureId === id);
}

export function structureHasTour(structureId: string): boolean {
  return getToursForStructure(structureId).length > 0;
}
