import { Item, GradeResult, ItemFormat } from '@savant/core';

export interface FormatDef {
  format: ItemFormat;
  name: string;
  description: string;
}

export interface DomainEngine {
  id: string; // 'math' | 'cs' | 'entomology' | ...
  formats: FormatDef[];
  grade(item: Item, userResponse: any): Promise<GradeResult>;
  explain(item: Item, userResponse: any, grade: GradeResult): Promise<{
    explanation: string;
    expertNotice?: string;
    followUpTopic?: string;
  }>;
}
