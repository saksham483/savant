import { z } from 'zod';

export const DomainIdSchema = z.enum([
  'math',
  'cs',
  'physics',
  'robotics',
  'astronomy',
  'entomology',
  'history',
  'psychology',
  'mysticism'
]);

export type DomainId = z.infer<typeof DomainIdSchema>;

export const DomainLayerSchema = z.enum([
  'core',
  'frontier',
  'orbit',
  'support',
  'reserved'
]);

export type DomainLayer = z.infer<typeof DomainLayerSchema>;

export interface DomainMeta {
  id: DomainId;
  name: string;
  layer: DomainLayer;
  defaultShare: number; // percentage (e.g. 0.30)
  color: string;
  description: string;
  status: 'active' | 'reserved' | 'locked';
}

export const DOMAINS: Record<DomainId, DomainMeta> = {
  math: {
    id: 'math',
    name: 'Mathematics',
    layer: 'core',
    defaultShare: 0.30,
    color: '#38bdf8', // sky-400
    description: 'Formal reasoning, proof scaffolds, calculus, linear algebra, and frontier foundations.',
    status: 'active'
  },
  cs: {
    id: 'cs',
    name: 'Computer Science',
    layer: 'core',
    defaultShare: 0.30,
    color: '#34d399', // emerald-400
    description: 'Algorithms, data structures, systems, computation theory, and practical mini-builds.',
    status: 'active'
  },
  robotics: {
    id: 'robotics',
    name: 'Robotics',
    layer: 'frontier',
    defaultShare: 0.15,
    color: '#f59e0b', // amber-500
    description: 'The frontier where math, physics, and CS converge into autonomous embodiment.',
    status: 'active'
  },
  astronomy: {
    id: 'astronomy',
    name: 'Astronomy',
    layer: 'orbit',
    defaultShare: 0.0625,
    color: '#818cf8', // indigo-400
    description: 'Sky navigation, celestial mechanics, light curves, and cosmic scale reasoning.',
    status: 'active'
  },
  entomology: {
    id: 'entomology',
    name: 'Entomology',
    layer: 'orbit',
    defaultShare: 0.0625,
    color: '#a3e635', // lime-400
    description: 'Insect biodiversity, morphology, taxonomy drills, and biomimicry transfer.',
    status: 'active'
  },
  history: {
    id: 'history',
    name: 'History',
    layer: 'orbit',
    defaultShare: 0.0625,
    color: '#fb7185', // rose-400
    description: 'Global chronological spine, primary source analysis, and history of science.',
    status: 'active'
  },
  psychology: {
    id: 'psychology',
    name: 'Psychology',
    layer: 'orbit',
    defaultShare: 0.0625,
    color: '#c084fc', // purple-400
    description: 'Cognitive science, research methodology, study replication, and metacognition.',
    status: 'active'
  },
  physics: {
    id: 'physics',
    name: 'Physics',
    layer: 'support',
    defaultShare: 0.0,
    color: '#60a5fa', // blue-400
    description: 'Mechanics, oscillations, and field theories pulled on-demand for robotics/astronomy.',
    status: 'active'
  },
  mysticism: {
    id: 'mysticism',
    name: 'Mysticism',
    layer: 'reserved',
    defaultShare: 0.0,
    color: '#94a3b8', // slate-400
    description: 'Reserved extension slot for comparative symbolism and philosophical hermeneutics.',
    status: 'reserved'
  }
};
