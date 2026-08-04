# Decimatex

Platform Sistem Pendukung Keputusan (SPK) yang mengotomatiskan analisis keputusan menggunakan metode MCDM (Multi-Criteria Decision Making). Decimatex mendukung web dan desktop (Electron) dengan backend Hono API + PostgreSQL.

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

## Prasyarat

- **Bun** (runtime utama — dipakai untuk script, dev server, dan spawn API di Electron)
- **PostgreSQL** (lokal atau cloud; URL diisi lewat `DATABASE_URL`)

## Menjalankan Proyek

### Web Development

```bash
# Install dependencies
bun install

# Development server (Vite only — API dipanggil lewat proxy /api -> localhost:3000)
bun run dev

# API backend standalone saja (watch mode, port default 3000)
bun run dev:api

# Development server + API backend (recommended)
bun run dev:full
```

### Production Build

```bash
# Type-check + build web
bun run build

# Preview hasil build
bun run preview
```

### Desktop Development

```bash
# Development mode (spawns API server :34567 + Vite + Electron)
bun run dev:desktop

# Build web (base ./) + run production desktop
bun run desktop

# Build saja untuk desktop
bun run build:desktop
```

### Database

```bash
# Generate migration (hanya saat schema berubah)
bun run db:generate

# Apply migration
bun run db:migrate

# Push schema langsung ke DB (dev only)
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
   - Tanpa `.env`, `drizzle.config.ts` memakai default `postgres://postgres:postgres@localhost:5432/decimatex`.
3. Jalankan `bun run db:migrate` — migration awal sudah ada di `drizzle/`; `db:generate` hanya dibutuhkan saat schema berubah.
4. Jalankan `bun run db:seed` untuk mengisi tabel metode DSS default.

## Arsitektur Project

```
decimatex/
├── src/
│   ├── main.tsx                  # React entry
│   ├── App.tsx
│   ├── router.tsx                # react-router-dom (browser/hash auto-detect)
│   ├── Home.tsx                  # Halaman utama
│   ├── Learn.tsx                 # Materi metode
│   ├── SelectMethod.tsx          # Pilih metode DSS
│   ├── MatrixPage.tsx            # Input kriteria, alternatif, matriks
│   ├── routes/
│   │   ├── History.tsx           # Riwayat analisis
│   │   └── HistoryDetail.tsx     # Detail hasil analisis
│   ├── components/
│   │   ├── layout/Layout.tsx     # Navbar + Outlet wrapper
│   │   ├── method-steps.tsx      # Step wizard metode
│   │   └── ui/                   # shadcn/ui components
│   ├── features/
│   │   ├── decision/
│   │   │   ├── lib/methods/      # 9 algoritma DSS modular
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
│   │   │   │   └── *.test.ts     # Unit tests per metode
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
│   │       ├── index.ts          # Re-export client & schema
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
- Mode dev (`bun run dev:desktop`) memuat Vite dev server (`--dev` flag); mode production memuat `dist/index.html`

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
- `ahp.test.ts` — AHP algorithm correctness
- `psi.test.ts` — PSI algorithm correctness

## Catatan Penting

- File konfigurasi shadcn: `components.json`
- CSS utama: `src/index.css`
- Alias path `@/*` aktif di TypeScript dan Vite
- Environment variable: `DATABASE_URL` (PostgreSQL); `PORT` untuk server API (default 3000)
- Vite dev proxy: `/api` → `http://localhost:3000` (lihat `vite.config.ts`)
- `src/server/index.ts` — definisi app Hono (CORS, health check, route mounting)
- `src/server/standalone.ts` — entry `Bun.serve`; dipakai `dev:api`, `dev:full`, production, dan Electron
