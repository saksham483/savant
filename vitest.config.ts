import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@savant/core': path.resolve(__dirname, './packages/core/src/index.ts'),
      '@savant/graph': path.resolve(__dirname, './packages/graph/src/index.ts'),
      '@savant/learner': path.resolve(__dirname, './packages/learner/src/index.ts'),
      '@savant/srs': path.resolve(__dirname, './packages/srs/src/index.ts'),
      '@savant/planner': path.resolve(__dirname, './packages/planner/src/index.ts'),
      '@savant/engagement': path.resolve(__dirname, './packages/engagement/src/index.ts'),
      '@savant/tutor': path.resolve(__dirname, './packages/tutor/src/index.ts'),
      '@savant/engines': path.resolve(__dirname, './packages/engines/src/index.ts'),
    }
  }
});
