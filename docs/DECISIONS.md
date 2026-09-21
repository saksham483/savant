# Architecture Decisions Record (ADR) — SAVANT

## ADR 001: Adoption of Google Gemini API with Gemini 3.8 Flash
- **Date:** 2026-09-20
- **Status:** Accepted
- **Context:** §15 of the specification recommends Anthropic Claude. The user explicitly commanded using the Google Gemini API with `gemini-3.8-flash`.
- **Decision:** Use Google Gemini API (`@google/genai` or direct REST integration) with default model `gemini-3.8-flash`. Model ID is configurable via `GEMINI_MODEL` and api key via `GEMINI_API_KEY`.
- **Consequences:** All AI tutoring, explain-back evaluations, and candidate item critique will run through Gemini 3.8 Flash with structured JSON output schemas (`zod`).

## ADR 002: Local Database — SQLite with Drizzle ORM
- **Date:** 2026-09-20
- **Status:** Accepted
- **Context:** §15 specifies PostgreSQL with Drizzle ORM, with SQLite acceptable for local development. A local development environment needs zero-friction, self-contained persistence without requiring a running external PostgreSQL daemon.
- **Decision:** Implement Drizzle ORM with `better-sqlite3` (or SQLite via file storage), designing tables with clean standard SQL typing so migrating to PostgreSQL is seamless.
- **Consequences:** Zero external database server requirement during local development and testing; single-file persistence (`savant.db`).

## ADR 003: Monorepo Setup with pnpm Workspaces
- **Date:** 2026-09-20
- **Status:** Accepted
- **Context:** System requires distinct packages for core types, graph management, learner model, scheduler, engines, tutor, and web interface.
- **Decision:** Structure repo using pnpm workspaces:
  - `apps/web`: Next.js 14+ App Router, Tailwind CSS, KaTeX, CodeMirror
  - `packages/core`: Interfaces, types, Zod schemas
  - `packages/graph`: Directed skill graph, prerequisite validation, fog-of-war logic
  - `packages/learner`: Elo/IRT ability updates, retention calculations
  - `packages/srs`: FSRS implementation
  - `packages/planner`: Session planner and anti-boredom variety rules
  - `packages/engagement`: Flow monitor, rewards, and achievements
  - `packages/engines`: Pluggable DomainEngine implementations
  - `packages/tutor`: Socratic hint ladder and rubric evaluation
  - `services/verifier`: Python FastAPI microservice with SymPy for algebraic verification
- **Consequences:** Strong modularity, clean testability, and isolated package dependencies.
