import fs from 'fs';
import path from 'path';
import { GraphManager } from '@savant/graph';
import { LearnerModel } from '@savant/learner';
import { FSRSScheduler } from '@savant/srs';
import { SessionPlanner } from '@savant/planner';
import { FlowMonitor } from '@savant/engagement';
import { EngineRegistry } from '@savant/engines';
import { TutorService } from '@savant/tutor';
import { Item, SkillNode, SkillEdge, Bridge } from '@savant/core';

class SavantStore {
  public graphManager = new GraphManager();
  public learnerModel = new LearnerModel();
  public srsScheduler = new FSRSScheduler();
  public sessionPlanner = new SessionPlanner();
  public flowMonitor = new FlowMonitor();
  public engineRegistry = new EngineRegistry();
  public tutorService = new TutorService();

  public items: Item[] = [];
  public bridges: Bridge[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    try {
      const bundlePath = path.resolve(process.cwd(), '../../content/seeded-bundle.json');
      const altPath = path.resolve(process.cwd(), 'content/seeded-bundle.json');
      const targetPath = fs.existsSync(bundlePath) ? bundlePath : altPath;

      if (fs.existsSync(targetPath)) {
        const raw = fs.readFileSync(targetPath, 'utf-8');
        const bundle = JSON.parse(raw);

        if (Array.isArray(bundle.nodes)) {
          for (const node of bundle.nodes) {
            this.graphManager.addNode(node);
          }
        }
        if (Array.isArray(bundle.edges)) {
          for (const edge of bundle.edges) {
            this.graphManager.addEdge(edge);
          }
        }
        if (Array.isArray(bundle.bridges)) {
          this.bridges = bundle.bridges;
        }
        if (Array.isArray(bundle.items)) {
          this.items = bundle.items;
        }
      }
    } catch (err) {
      console.warn('Data store loaded fallback defaults:', err);
    }

    this.initialized = true;
  }
}

// Global singleton for Next.js hot-reload persistence
const globalForSavant = globalThis as unknown as { savantStore?: SavantStore };
export const savantStore = globalForSavant.savantStore || new SavantStore();
if (process.env.NODE_ENV !== 'production') globalForSavant.savantStore = savantStore;
