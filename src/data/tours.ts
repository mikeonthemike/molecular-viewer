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
        cameraPositionScale: [0.6, 0.4, 1.1],
        cameraTargetScale: [0.1, 0.05, 0],
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
        cameraPositionScale: [0.5, 0.3, 0.9],
        cameraTargetScale: [0.1, 0.05, 0],
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
        cameraPositionScale: [-1.2, 0.8, 2.4],
        cameraTargetScale: [0, 0, 0],
        visibleChains: ['A', 'B'],
        highlightResidues: [99],
        highlightChains: ['A', 'B'],
        representation: 'ribbon',
        colorScheme: 'chain',
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
