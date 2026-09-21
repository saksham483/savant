import { DomainEngine } from './engine-interface.js';
import { MathEngine } from './math-engine.js';
import { CSEngine } from './cs-engine.js';

export class EngineRegistry {
  private engines: Map<string, DomainEngine> = new Map();

  constructor() {
    this.register(new MathEngine());
    this.register(new CSEngine());
  }

  register(engine: DomainEngine): void {
    this.engines.set(engine.id, engine);
  }

  getEngine(domainId: string): DomainEngine | undefined {
    return this.engines.get(domainId);
  }

  getAllEngines(): DomainEngine[] {
    return Array.from(this.engines.values());
  }
}
