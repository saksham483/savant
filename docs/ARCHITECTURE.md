# SAVANT Architecture

## Overview
SAVANT is a single-user mastery engine designed for extreme depth in Mathematics and Computer Science, supported by Orbit domains (Astronomy, Entomology, History, Psychology), and converging at Robotics as the frontier.

```
┌────────────────────────── Browser (PWA) ──────────────────────────┐
│ Home/Today │ Session Player │ Map │ Lab │ Notebook │ Insights      │
│   ├─ Domain Renderers (math, code, ID, sky, timeline, sim…)        │
│   ├─ Pyodide worker (code exec) │ Sim workers │ MathLive/KaTeX      │
│   └─ Offline queue (IndexedDB)                                      │
└──────────────┬──────────────────────────────────────────────────────┘
               │ HTTPS (JSON)
┌──────────────▼──────────────── Next.js server ──────────────────────┐
│ API layer                                                            │
│  ├─ Session Planner ── Learner Model ── FSRS Scheduler               │
│  ├─ Engagement (flow monitor, variety rules, rewards)                │
│  ├─ Domain Engine registry (grade/generate/explain)                  │
│  ├─ Tutor service (Gemini 3.8 Flash orchestration, guardrails)       │
│  ├─ Bridge service │ Notebook │ Insights/Audits                      │
│  └─ Content service (graph, items, fact store)                       │
└───────┬───────────────────────┬──────────────────────┬──────────────┘
        │                       │                      │
     SQLite              FastAPI (SymPy,        Google Gemini API
  (graph, items,          test sandbox,          (Gemini 3.8 Flash,
   attempts, SRS…)        verifier service)      tutor, rubric grading)
```

## Packages
- `@savant/core`: Shared types, domain contracts, Zod schemas, error models.
- `@savant/graph`: Directed graph algorithms, prerequisite checks, fog-of-war.
- `@savant/learner`: Elo/IRT ability tracking ($\theta$), error profiling, calibration.
- `@savant/srs`: FSRS spaced repetition wrapper and review triage.
- `@savant/planner`: Session construction, variety enforcement, mood-based allocation.
- `@savant/engagement`: Real-time flow monitor, anti-boredom heuristics, rewards.
- `@savant/engines`: Pluggable domain engines (Math, CS, Entomology, Astronomy, etc.).
- `@savant/tutor`: Socratic guidance, hint ladder (L0-L4), Gemini 3.8 Flash integration.
- `services/verifier`: Python microservice using SymPy for algebraic verification.
