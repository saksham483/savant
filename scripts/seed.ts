import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { SkillNode, SkillEdge, Bridge, Item } from '@savant/core';

interface SeedData {
  nodes: SkillNode[];
  edges: SkillEdge[];
  bridges: Bridge[];
  items: Item[];
}

export function loadSeedData(baseDir: string = process.cwd()): SeedData {
  const contentDir = path.resolve(baseDir, 'content');
  const graphFile = path.join(contentDir, 'graph', 'curriculum.yaml');
  const bridgesFile = path.join(contentDir, 'graph', 'bridges.yaml');
  const skillsDir = path.join(contentDir, 'skills');

  let nodes: SkillNode[] = [];
  let edges: SkillEdge[] = [];
  let bridges: Bridge[] = [];
  let items: Item[] = [];

  // 1. Load Curriculum Graph
  if (fs.existsSync(graphFile)) {
    const raw = fs.readFileSync(graphFile, 'utf-8');
    const parsed = YAML.parse(raw);
    nodes = parsed.nodes || [];
    edges = parsed.edges || [];
  }

  // 2. Load Bridges
  if (fs.existsSync(bridgesFile)) {
    const raw = fs.readFileSync(bridgesFile, 'utf-8');
    const parsed = YAML.parse(raw);
    bridges = parsed.bridges || [];
  }

  // 3. Load Per-Skill YAMLs
  if (fs.existsSync(skillsDir)) {
    const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const file of files) {
      const filePath = path.join(skillsDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const skillDoc = YAML.parse(raw);
      if (skillDoc.items && Array.isArray(skillDoc.items)) {
        for (const item of skillDoc.items) {
          items.push({
            ...item,
            domain: skillDoc.domain || 'math',
            skillId: skillDoc.id
          });
        }
      }
    }
  }

  return { nodes, edges, bridges, items };
}

export function runSeed() {
  console.log('Seeding SAVANT curriculum and verified items...');
  const data = loadSeedData();
  const outPath = path.resolve(process.cwd(), 'content', 'seeded-bundle.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Successfully seeded:
  - ${data.nodes.length} Skill Nodes
  - ${data.edges.length} Prerequisite Edges
  - ${data.bridges.length} Cross-Domain Bridges
  - ${data.items.length} Pre-verified Items
  Output bundle saved to: ${outPath}`);
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts')) {
  runSeed();
}
