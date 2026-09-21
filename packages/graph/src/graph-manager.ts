import {
  SkillNode,
  SkillEdge,
  SkillGraphState,
  MasteryTier,
  MasteryTierValue
} from '@savant/core';
import YAML from 'yaml';

export class GraphManager {
  private nodes: Map<string, SkillNode> = new Map();
  private edges: SkillEdge[] = [];
  private incomingPrereqs: Map<string, string[]> = new Map();
  private outgoingDependents: Map<string, string[]> = new Map();

  addNode(node: SkillNode): void {
    this.nodes.set(node.id, node);
    if (!this.incomingPrereqs.has(node.id)) {
      this.incomingPrereqs.set(node.id, []);
    }
    // Register hard prereqs
    for (const prereq of node.prereqs) {
      this.addEdge({
        fromId: prereq,
        toId: node.id,
        kind: 'prereq'
      });
    }
  }

  addEdge(edge: SkillEdge): void {
    this.edges.push(edge);
    if (edge.kind === 'prereq') {
      const inc = this.incomingPrereqs.get(edge.toId) || [];
      if (!inc.includes(edge.fromId)) {
        inc.push(edge.fromId);
        this.incomingPrereqs.set(edge.toId, inc);
      }

      const out = this.outgoingDependents.get(edge.fromId) || [];
      if (!out.includes(edge.toId)) {
        out.push(edge.toId);
        this.outgoingDependents.set(edge.fromId, out);
      }
    }
  }

  getNode(id: string): SkillNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): SkillNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): SkillEdge[] {
    return [...this.edges];
  }

  /**
   * Unlock rule (§5): A node becomes available when ALL hard prerequisites are >= Solid (tier 3).
   */
  isNodeUnlocked(skillId: string, userStates: Record<string, { tier: MasteryTierValue }>): boolean {
    const node = this.nodes.get(skillId);
    if (!node) return false;

    const prereqs = this.incomingPrereqs.get(skillId) || [];
    if (prereqs.length === 0) return true; // root nodes are always available

    return prereqs.every(prereqId => {
      const state = userStates[prereqId];
      return state && state.tier >= MasteryTier.SOLID;
    });
  }

  /**
   * Fog-of-war map rule (§5):
   * - fully_revealed: unlocked, or user has already glimpsed/practiced it
   * - silhouette: 1 hop ahead of an available/learning/solid node (title revealed)
   * - fog: deeper unexplored region (shape only)
   */
  getNodeVisibility(
    skillId: string,
    userStates: Record<string, { tier: MasteryTierValue }>
  ): 'fully_revealed' | 'silhouette' | 'fog' {
    const userState = userStates[skillId];
    if (userState && userState.tier > MasteryTier.FOG) {
      return 'fully_revealed';
    }

    if (this.isNodeUnlocked(skillId, userStates)) {
      return 'fully_revealed';
    }

    // Check if 1 hop away from any unlocked or learning node
    const prereqs = this.incomingPrereqs.get(skillId) || [];
    const isOneHop = prereqs.some(prereqId => {
      const pState = userStates[prereqId];
      return pState && pState.tier >= MasteryTier.LEARNING;
    });

    if (isOneHop) {
      return 'silhouette';
    }

    return 'fog';
  }

  /**
   * Finds prerequisite chain from currently available nodes to a target skill
   */
  findGoalPath(targetSkillId: string): string[] {
    if (!this.nodes.has(targetSkillId)) return [];

    const path: string[] = [];
    const visited = new Set<string>();

    const dfs = (currId: string) => {
      if (visited.has(currId)) return;
      visited.add(currId);
      const prereqs = this.incomingPrereqs.get(currId) || [];
      for (const p of prereqs) {
        dfs(p);
      }
      path.push(currId);
    };

    dfs(targetSkillId);
    return path;
  }

  loadFromYaml(yamlContent: string): void {
    const data = YAML.parse(yamlContent);
    if (Array.isArray(data.nodes)) {
      for (const n of data.nodes) {
        this.addNode(n);
      }
    }
    if (Array.isArray(data.edges)) {
      for (const e of data.edges) {
        this.addEdge(e);
      }
    }
  }
}
