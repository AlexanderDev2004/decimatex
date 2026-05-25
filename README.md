# Decimatex

Platform Sistem Pendukung Keputusan (SPK) yang mengotomatiskan analisis keputusan menggunakan metode MCDM (Multi-Criteria Decision Making). Decimatex mendukung web dan desktop (Electron) dengan backend Hono API + PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript 5, Vite 7 |
| Styling | Tailwind CSS v4, shadcn/ui |
| State & Fetching | TanStack Query, React Router DOM |
| Backend | Hono, Effect-TS |
| Database | PostgreSQL, Drizzle ORM |
| Runtime | Bun |
| Desktop | Electron |
| Testing | Vitest, Testing Library |

## Menjalankan Proyek

### Web Development

```bash
# Install dependencies
bun install

# Development server (Vite only)
bun run dev

# Development server + API backend (recommended)
bun run dev:full
```

### Desktop Development

```bash
# Development mode (spawns API server + Vite + Electron)
bun run dev:desktop

# Build and run production desktop
bun run desktop
```

### Database

```bash
# Generate migration
bun run db:generate

# Apply migration
bun run db:migrate

# Push schema directly (dev only)
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

## Setup Database

1. Copy `.env.example` menjadi `.env`.
2. Isi `DATABASE_URL` dengan URL PostgreSQL lokal/cloud.
3. Jalankan `bun run db:generate`.
4. Jalankan `bun run db:migrate`.
5. Jalankan `bun run db:seed` untuk mengisi tabel metode DSS default.

## Arsitektur Project

```
decimatex/
├── src/
│   ├── features/decision/
│   │   ├── lib/methods/          # 9 algoritma DSS modular
│   │   │   ├── topsis.ts
│   │   │   ├── edas.ts
│   │   │   ├── psi.ts
│   │   │   ├── moora.ts
│   │   │   ├── vikor.ts
│   │   │   ├── ahp.ts
│   │   │   ├── copras.ts
│   │   │   ├── promethee.ts
│   │   │   ├── electre.ts
│   │   │   ├── shared.ts         # Utilities & types
│   │   │   └── index.ts          # Method registry
│   │   └── hooks/                # TanStack Query hooks
│   │       ├── use-decisions.ts
│   │       ├── use-criteria.ts
│   │       ├── use-alternatives.ts
│   │       ├── use-matrix.ts
│   │       └── use-analysis.ts
│   ├── server/
│   │   ├── index.ts              # Hono app entry
│   │   ├── standalone.ts         # Bun.serve standalone
│   │   ├── routes/               # Hono route handlers
│   │   │   ├── decisions.ts
│   │   │   ├── criteria.ts
│   │   │   ├── alternatives.ts
│   │   │   ├── matrix.ts
│   │   │   └── analysis.ts
│   │   ├── services/             # Effect-TS business logic
│   │   │   ├── decision-service.ts
│   │   │   ├── criteria-service.ts
│   │   │   ├── alternative-service.ts
│   │   │   ├── matrix-service.ts
│   │   │   └── analysis-service.ts
│   │   └── db/
│   │       ├── client.ts         # Drizzle client
│   │       ├── schema.ts         # PostgreSQL schema
│   │       └── seed.ts           # Seed script
│   ├── routes/                   # React pages
│   │   ├── Home.tsx
│   │   ├── Learn.tsx
│   │   ├── SelectMethod.tsx
│   │   ├── MatrixPage.tsx
│   │   ├── History.tsx
│   │   └── HistoryDetail.tsx
│   ├── components/layout/
│   │   └── Layout.tsx            # Navbar + Outlet wrapper
│   ├── components/ui/            # shadcn/ui components
│   ├── lib/
│   │   ├── utils.ts              # cn() helper
│   │   └── api-client.ts       # Typed fetch wrapper
│   ├── App.tsx
│   ├── router.tsx
│   └── index.css
├── electron/
│   ├── main.cjs                  # Electron main process (spawns API)
│   └── preload.cjs               # IPC preload script
├── drizzle/                      # Migration files
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/decisions` | List all decisions |
| POST | `/api/decisions` | Create new decision |
| GET | `/api/decisions/:id` | Get decision by ID |
| PATCH | `/api/decisions/:id` | Update decision |
| DELETE | `/api/decisions/:id` | Delete decision |
| GET | `/api/decisions/:id/criteria` | List criteria |
| POST | `/api/decisions/:id/criteria` | Add criteria |
| GET | `/api/decisions/:id/alternatives` | List alternatives |
| POST | `/api/decisions/:id/alternatives` | Add alternative |
| GET | `/api/decisions/:id/matrix` | Get matrix values |
| POST | `/api/decisions/:id/matrix` | Save matrix value |
| POST | `/api/analysis/run` | Run DSS analysis |
| GET | `/api/analysis/history/:decisionId` | Get analysis history |

## Metode DSS yang Didukung

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

## Struktur DSS Pipeline

Setiap metode mengikuti pipeline standar:

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

Semua metode mengimplementasikan interface `runMethod(method, criteria, alternatives, matrix, weights)` yang di-export dari `src/features/decision/lib/methods/index.ts`.

## Desktop (Electron)

Saat dijalankan sebagai aplikasi desktop:

- **Main process** spawn Hono API server di port internal (default 34567)
- **Renderer** berkomunikasi via IPC untuk mendapatkan port server
- **API client** auto-detect Electron dan mengarahkan ke `localhost:${port}`
- Router otomatis memakai hash mode saat dijalankan dari `file://`

## Testing

```bash
# Run all tests
bun run test

# Run specific test file
bunx vitest run src/features/decision/lib/methods/topsis.test.ts
```

Tests tersedia untuk:
- `shared.test.ts` — utilities (`buildMatrix2d`, `normalizeWeights`, `formatNumber`)
- `topsis.test.ts` — TOPSIS algorithm correctness
- `edas.test.ts` — EDAS algorithm correctness

## Catatan Penting

- File konfigurasi shadcn: `components.json`
- CSS utama: `src/index.css`
- Alias path `@/*` aktif di TypeScript dan Vite
- Environment variable: `DATABASE_URL` (PostgreSQL)
- `src/server/standalone.ts` digunakan untuk menjalankan server standalone (production/Electron)
- `src/server/index.ts` digunakan untuk development dengan Hono middleware
