# Decimatex

Decimatex is a Decision Support System (DSS) platform that automates decision analysis using MCDM (Multi-Criteria Decision Making) methods. Decimatex supports web and desktop (Electron) with a Hono API + PostgreSQL backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS v4, shadcn/ui |
| State & Fetching | TanStack Query, React Router DOM v7 |
| Backend | Hono, Effect-TS |
| Database | PostgreSQL, Drizzle ORM |
| Runtime | Bun |
| Desktop | Electron |
| Testing | Vitest, Testing Library |

## Prerequisites

- **Bun** (primary runtime — used for scripts, the dev server, and spawning the API in Electron)
- **PostgreSQL** (local or cloud; URL set via `DATABASE_URL`)

## Running the Project

### Web Development

```bash
# Install dependencies
bun install

# Development server (Vite only — API is called through the proxy /api -> localhost:3000)
bun run dev

# Standalone API backend only (watch mode, default port 3000)
bun run dev:api

# Development server + API backend (recommended)
bun run dev:full
```

### Production Build

```bash
# Type-check + build web
bun run build

# Preview the production build
bun run preview
```

### Desktop Development

```bash
# Development mode (spawns API server :34567 + Vite + Electron)
bun run dev:desktop

# Build web (base ./) + run production desktop
bun run desktop

# Desktop-only build
bun run build:desktop
```

### Database

```bash
# Generate migration (only when the schema changes)
bun run db:generate

# Apply migration
bun run db:migrate

# Push schema directly to the DB (dev only)
bun run db:push

# Open Drizzle Studio
bun run db:studio

# Seed default DSS methods
bun run db:seed
```

### Testing & Quality

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Lint
bun run lint

# Type check
bunx tsc -b
```

## Database Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your local/cloud PostgreSQL URL.
   - Without `.env`, `drizzle.config.ts` falls back to `postgres://postgres:postgres@localhost:5432/decimatex`.
3. Run `bun run db:migrate` — the initial migration already exists in `drizzle/`; `db:generate` is only needed when the schema changes.
4. Run `bun run db:seed` to populate the default DSS method table.

## Project Structure

```
decimatex/
├── src/
│   ├── main.tsx                  # React entry
│   ├── App.tsx
│   ├── router.tsx                # react-router-dom (browser/hash auto-detect)
│   ├── Home.tsx                  # Home page
│   ├── Learn.tsx                 # Method learning materials
│   ├── SelectMethod.tsx          # DSS method selection
│   ├── MatrixPage.tsx            # Criteria, alternatives, and matrix input
│   ├── routes/
│   │   ├── History.tsx           # Analysis history
│   │   └── HistoryDetail.tsx     # Analysis result detail
│   ├── components/
│   │   ├── layout/Layout.tsx     # Navbar + Outlet wrapper
│   │   ├── method-steps.tsx      # Method step wizard
│   │   └── ui/                   # shadcn/ui components
│   ├── features/
│   │   ├── decision/
│   │   │   ├── lib/methods/      # 9 modular DSS algorithms
│   │   │   │   ├── topsis.ts
│   │   │   │   ├── edas.ts
│   │   │   │   ├── psi.ts
│   │   │   │   ├── moora.ts
│   │   │   │   ├── vikor.ts
│   │   │   │   ├── ahp.ts
│   │   │   │   ├── copras.ts
│   │   │   │   ├── promethee.ts
│   │   │   │   ├── electre.ts
│   │   │   │   ├── shared.ts     # Utilities & types
│   │   │   │   ├── index.ts      # Method registry
│   │   │   │   └── *.test.ts     # Unit tests per method
│   │   │   └── hooks/            # TanStack Query hooks
│   │   │       ├── use-decisions.ts
│   │   │       ├── use-criteria.ts
│   │   │       ├── use-alternatives.ts
│   │   │       ├── use-matrix.ts
│   │   │       └── use-analysis.ts
│   │   └── tutorial/             # Driver.js guided tour
│   ├── server/
│   │   ├── index.ts              # Hono app (CORS + /api/health + routes)
│   │   ├── standalone.ts         # Bun.serve entry (env PORT, default 3000)
│   │   ├── routes/               # Hono route handlers
│   │   │   ├── decisions.ts
│   │   │   ├── criteria.ts
│   │   │   ├── alternatives.ts
│   │   │   ├── matrix.ts
│   │   │   ├── analysis.ts
│   │   │   └── effect-error.ts   # Error unwrap helper
│   │   ├── services/             # Effect-TS business logic
│   │   │   ├── decision-service.ts
│   │   │   ├── criteria-service.ts
│   │   │   ├── alternative-service.ts
│   │   │   ├── matrix-service.ts
│   │   │   └── analysis-service.ts
│   │   └── db/
│   │       ├── client.ts         # Drizzle client
│   │       ├── index.ts          # Re-exports client & schema
│   │       ├── schema.ts         # PostgreSQL schema
│   │       └── seed.ts           # Seed script
│   ├── lib/
│   │   ├── utils.ts              # cn() helper
│   │   └── api-client.ts         # Typed fetch wrapper (Electron-aware)
│   └── index.css
├── electron/
│   ├── main.cjs                  # Electron main process (spawns API :34567)
│   └── preload.cjs               # IPC preload script
├── drizzle/                      # Migration files
├── public/
├── .github/workflows/            # CI
├── vite.config.ts
├── vitest.config.ts
├── vitest.setup.ts
├── drizzle.config.ts
├── components.json
├── Dockerfile
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/decisions` | List all decisions |
| POST | `/api/decisions` | Create new decision |
| GET | `/api/decisions/:id` | Get decision by ID |
| PATCH | `/api/decisions/:id` | Update decision |
| DELETE | `/api/decisions/:id` | Delete decision |
| GET | `/api/decisions/:id/criteria` | List criteria |
| POST | `/api/decisions/:id/criteria` | Add criteria |
| PATCH | `/api/decisions/:id/criteria/:criteriaId` | Update criteria weight |
| DELETE | `/api/decisions/:id/criteria/:criteriaId` | Delete criteria |
| POST | `/api/decisions/:id/criteria/normalize` | Normalize criteria weights |
| GET | `/api/decisions/:id/alternatives` | List alternatives |
| POST | `/api/decisions/:id/alternatives` | Add alternative |
| PATCH | `/api/decisions/:id/alternatives/:alternativeId` | Update alternative |
| DELETE | `/api/decisions/:id/alternatives/:alternativeId` | Delete alternative |
| GET | `/api/decisions/:id/matrix` | Get matrix values |
| POST | `/api/decisions/:id/matrix` | Save matrix value |
| DELETE | `/api/decisions/:id/matrix/:alternativeId/:criteriaId` | Delete matrix value |
| POST | `/api/analysis/run` | Run DSS analysis |
| GET | `/api/analysis/history/:decisionId` | Get analysis history |

## Supported DSS Methods

| Method | Full Name | Description |
|--------|-----------|-------------|
| TOPSIS | Technique for Order Preference by Similarity | Distance to ideal/anti-ideal solutions |
| AHP | Analytic Hierarchy Process | Pairwise comparison (simplified) |
| EDAS | Evaluation based on Distance from Average | Compare against average solution |
| PSI | Preference Selection Index | Preference variation ranking |
| VIKOR | VIKOR Compromise Solution | Compromise ranking with utility & regret |
| MOORA | Multi-Objective Optimization Ratio Analysis | Benefit/cost ratio system |
| ELECTRE | ELimination and Choice Expressing Reality | Outranking with concordance/discordance |
| PROMETHEE | Preference Ranking Organization Method | Outranking with preference functions |
| COPRAS | Complex Proportional Assessment | Proportional utility ranking |

## DSS Pipeline Structure

Every method follows the standard pipeline:

```
Input Matrix
    ↓
Normalization
    ↓
Weight Application
    ↓
Method-specific Computation
    ↓
Score Generation
    ↓
Ranking Output
```

All methods implement the `runMethod(method, criteria, alternatives, matrix, weights)` interface exported from `src/features/decision/lib/methods/index.ts`.

## Desktop (Electron)

When running as a desktop application:

- **Main process** spawns the Hono API server on an internal port (default 34567)
- **Renderer** communicates via IPC to get the server port
- **API client** auto-detects Electron and points to `localhost:${port}`
- The router automatically uses hash mode when running from `file://`
- Dev mode (`bun run dev:desktop`) loads the Vite dev server (`--dev` flag); production mode loads `dist/index.html`

## Testing

```bash
# Run all tests
bun run test

# Run specific test file
bunx vitest run src/features/decision/lib/methods/topsis.test.ts
```

Tests are available for:
- `shared.test.ts` — utilities (`buildMatrix2d`, `normalizeWeights`, `formatNumber`)
- `topsis.test.ts` — TOPSIS algorithm correctness
- `edas.test.ts` — EDAS algorithm correctness
- `ahp.test.ts` — AHP algorithm correctness
- `psi.test.ts` — PSI algorithm correctness

## Important Notes

- shadcn configuration file: `components.json`
- Main CSS: `src/index.css`
- The `@/*` path alias is active in TypeScript and Vite
- Environment variables: `DATABASE_URL` (PostgreSQL); `PORT` for the API server (default 3000)
- Vite dev proxy: `/api` → `http://localhost:3000` (see `vite.config.ts`)
- `src/server/index.ts` — Hono app definition (CORS, health check, route mounting)
- `src/server/standalone.ts` — `Bun.serve` entry; used by `dev:api`, `dev:full`, production, and Electron
