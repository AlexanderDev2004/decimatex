# Decimatex

Frontend project untuk Decimatex (Decision Support System) menggunakan React + TypeScript + Vite, dengan UI berbasis Tailwind CSS v4 dan shadcn/ui.

## Analisis Kondisi Proyek Saat Ini

Berikut hasil analisis struktur dan setup terbaru:

1. **Framework & Build**
- Menggunakan Vite + React + TypeScript.
- Script aktif di `package.json`: `dev`, `dev:desktop`, `build`, `build:desktop`, `desktop`, `lint`, `preview`, dan command DB Drizzle.

2. **Routing & Data Layer**
- Routing menggunakan `react-router-dom` (`createBrowserRouter`).
- `QueryClientProvider` dari TanStack Query sudah dipasang di root app.

3. **UI System**
- shadcn/ui sudah terinisialisasi (`components.json` tersedia).
- Tailwind CSS v4 aktif via `@tailwindcss/vite`.
- Alias `@/*` sudah aktif di TypeScript dan Vite.
- Komponen shadcn yang sudah tersedia:
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/card.tsx`

4. **Status Implementasi Halaman**
- `src/Home.tsx` sudah memakai contoh nyata `Card`, `Input`, dan `Button`.
- Build terakhir dalam kondisi sukses.

## Tech Stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS v4
- shadcn/ui
- TanStack Query
- React Router DOM
- Electron (desktop shell)
- Bun runtime
- PostgreSQL
- Drizzle ORM

## Menjalankan Proyek

```bash
# install dependencies
bun install

# development server
bun run dev

# development desktop (Electron + Vite)
bun run dev:desktop

# production build
bun run build

# desktop build (assets relatif untuk file://)
bun run build:desktop

# jalankan desktop app (otomatis build desktop)
bun run desktop

# lint
bun run lint

# preview build
bun run preview

# generate migration dari schema drizzle
bun run db:generate

# apply migration ke database
bun run db:migrate

# push schema langsung (opsional, dev only)
bun run db:push

# buka drizzle studio
bun run db:studio
```

## Menjalankan Versi Desktop

Alur yang direkomendasikan:

```bash
# mode pengembangan desktop
bun run dev:desktop

# mode desktop sekali jalan (otomatis build)
bun run desktop

# atau build desktop manual lalu jalankan
bun run build:desktop
electron .
```

Catatan:

- Router otomatis memakai hash mode saat dijalankan dari file lokal (`file://`) supaya navigasi tetap aman di Electron.

## Desain Database DSS

Schema PostgreSQL + Drizzle yang sudah disiapkan ada di `src/server/db/schema.ts`, dengan tabel inti:

- `decision_problems`
- `criteria`
- `alternatives`
- `decision_matrix_values`
- `methods`
- `analysis_runs`
- `analysis_results`

Constraint penting yang sudah dipasang:

- Unique nama kriteria/alternatif per decision.
- Composite key pada nilai matrix (`decision_id`, `alternative_id`, `criteria_id`).
- Relasi kuat untuk menjaga matrix dan result tetap pada decision yang sama.
- Seed default metode DSS (AHP, TOPSIS, EDAS, PSI, VIKOR, MOORA, ELECTRE, PROMETHEE, COPRAS).

## Setup DB Cepat

1. Copy `.env.example` menjadi `.env`.
2. Isi `DATABASE_URL` PostgreSQL lokal/cloud.
3. Jalankan `bun run db:generate`.
4. Jalankan `bun run db:migrate`.

## Menambah Komponen shadcn/ui

Setelah `init`, tambahkan komponen dengan command `add`.

```bash
# satu komponen
bunx shadcn@latest add button

# beberapa komponen sekaligus
bunx shadcn@latest add input card dialog
```

Komponen akan dibuat di `src/components/ui`.

## Cara Pakai Komponen (Contoh)

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ExampleForm() {
  return (
    <div className="space-y-3">
      <Input type="email" placeholder="you@example.com" />
      <Button>Kirim</Button>
    </div>
  )
}
```

Contoh penggunaan lebih lengkap ada di `src/Home.tsx`.

## Struktur Direktori Ringkas

```txt
src/
  components/
    ui/
      button.tsx
      card.tsx
      input.tsx
  lib/
    utils.ts
  server/
    db/
      schema.ts
  App.tsx
  Home.tsx
  router.tsx
  index.css
```

## Catatan Konfigurasi Penting

- File konfigurasi shadcn: `components.json`
- CSS utama shadcn + Tailwind: `src/index.css`
- Alias path `@/*`:
  - `tsconfig.json`
  - `tsconfig.app.json`
  - `vite.config.ts`

Jika komponen baru tidak muncul style-nya, cek bahwa `src/index.css` masih mengimpor:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```
