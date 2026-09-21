import {
  Item,
  SessionPlan,
  SessionMood,
  SessionBlock,
  targetDifficultyForSkill,
  SRSCard
} from '@savant/core';
import { validateVarietyRules } from './variety-rules.js';

export interface PlanSessionOptions {
  userId: string;
  minutes: 10 | 25 | 45 | 90;
  mood: SessionMood;
  userThetas: Record<string, number>;
  availableItems: Item[];
  dueCards?: SRSCard[];
}

export class SessionPlanner {
  planSession(options: PlanSessionOptions): SessionPlan {
    const { userId, minutes, mood, userThetas, availableItems, dueCards = [] } = options;

    const blocks: SessionBlock[] = [];
    const chosenItems: Item[] = [];

    // Helper to pick item near target difficulty
    const pickItem = (
      domainFilter: (d: string) => boolean,
      preferredFormats?: string[],
      diffOffset: number = 0
    ): Item | undefined => {
      const candidates = availableItems.filter(
        it => domainFilter(it.domain) && !chosenItems.some(c => c.id === it.id)
      );
      if (candidates.length === 0) return undefined;

      // Filter by format if provided
      const formatFiltered = preferredFormats
        ? candidates.filter(c => preferredFormats.includes(c.format))
        : candidates;
      const pool = formatFiltered.length > 0 ? formatFiltered : candidates;

      // Sort by closeness to target difficulty
      return pool.sort((a, b) => {
        const thetaA = userThetas[a.skillId] ?? 0.0;
        const targetA = targetDifficultyForSkill(thetaA) + diffOffset;
        const thetaB = userThetas[b.skillId] ?? 0.0;
        const targetB = targetDifficultyForSkill(thetaB) + diffOffset;
        return Math.abs(a.difficulty - targetA) - Math.abs(b.difficulty - targetB);
      })[0];
    };

    // Difficulty adjustment based on mood (§7.2)
    const moodOffset = mood === 'Sharp' ? 0.6 : mood === 'Chill' ? -0.6 : 0.0;

    // 1. WARM-UP BLOCK
    // Retrieval: Confidence starter item first (§11.3)
    const warmupMinutes = minutes <= 10 ? 2 : Math.round(minutes * 0.16);
    const starterItem = pickItem(() => true, ['computational', 'multiple-choice'], -0.8);
    const warmupItems: Item[] = [];
    if (starterItem) {
      warmupItems.push(starterItem);
      chosenItems.push(starterItem);
    }
    blocks.push({
      id: `block_warmup_${Date.now()}`,
      type: 'warmup',
      title: 'Warm-up: Retrieval',
      targetMinutes: warmupMinutes,
      items: warmupItems,
      formatMix: warmupItems.map(it => it.format)
    });

    // 2. DEEP CORE BLOCK (Math / CS)
    const deepMinutes = minutes <= 10 ? 5 : Math.round(minutes * 0.40);
    const deepFormats = mood === 'Sharp'
      ? ['proof_scaffold', 'write_code', 'computational']
      : ['computational', 'bug_hunt', 'explain_back'];

    const deepItems: Item[] = [];
    const coreItem1 = pickItem(d => d === 'math' || d === 'cs', deepFormats, moodOffset);
    if (coreItem1) {
      deepItems.push(coreItem1);
      chosenItems.push(coreItem1);
    }

    // Pick second deep item with a different format
    const alternateFormat = coreItem1?.format === 'computational' ? ['proof_scaffold', 'explain_back', 'write_code'] : ['computational'];
    const coreItem2 = pickItem(d => d === 'math' || d === 'cs', alternateFormat, moodOffset);
    if (coreItem2) {
      deepItems.push(coreItem2);
      chosenItems.push(coreItem2);
    }

    blocks.push({
      id: `block_deep_${Date.now()}`,
      type: 'deep',
      title: 'Deep Focus: Core Domain',
      targetMinutes: deepMinutes,
      items: deepItems,
      formatMix: deepItems.map(it => it.format)
    });

    // 3. ORBIT BLOCK (Astronomy / Entomology / History / Psychology)
    const orbitMinutes = minutes <= 10 ? 3 : Math.round(minutes * 0.24);
    const orbitItem = pickItem(
      d => ['astronomy', 'entomology', 'history', 'psychology'].includes(d),
      undefined,
      mood === 'Chill' ? -0.4 : 0.0
    );
    const orbitItems: Item[] = [];
    if (orbitItem) {
      orbitItems.push(orbitItem);
      chosenItems.push(orbitItem);
    }
    blocks.push({
      id: `block_orbit_${Date.now()}`,
      type: 'orbit',
      title: 'Orbit: Expanding Horizons',
      targetMinutes: orbitMinutes,
      items: orbitItems,
      formatMix: orbitItems.map(it => it.format)
    });

    // 4. BRIDGE / STORY / REWARDING WRAP-UP
    const wrapMinutes = minutes <= 10 ? 0 : Math.round(minutes * 0.20);
    const wrapItems: Item[] = [];
    if (wrapMinutes > 0) {
      // Pick a rewarding wrap item (e.g. explain-back, insight, or high-confidence item)
      const wrapItem = pickItem(() => true, ['explain_back', 'computational'], -0.4);
      if (wrapItem) {
        wrapItems.push(wrapItem);
        chosenItems.push(wrapItem);
      }
      blocks.push({
        id: `block_wrap_${Date.now()}`,
        type: 'wrap',
        title: 'Wrap-up & Curiosity Reflection',
        targetMinutes: wrapMinutes,
        items: wrapItems,
        formatMix: wrapItems.map(it => it.format),
        hook: "How does the invariant structure you practiced today connect to the physical world?"
      });
    }

    const allSessionItems = blocks.flatMap(b => b.items);

    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      minutes,
      mood,
      blocks,
      totalItems: allSessionItems.length,
      createdAt: new Date().toISOString()
    };
  }
}
